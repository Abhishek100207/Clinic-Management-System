# NOTE: This consumer handles chat WebSockets. It is currently placed here to avoid
# restructuring, but should be moved to a dedicated chat app if the project grows.

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import ChatMessage

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        token = None
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break

        if not token:
            await self.close(code=4001)
            return

        user = await self.authenticate_token(token)
        if not user:
            await self.close(code=4001)
            return

        self.user = user
        self.other_user_id = self.scope['url_route']['kwargs']['other_user_id']

        min_id = min(self.user.id, self.other_user_id)
        max_id = max(self.user.id, self.other_user_id)
        self.room_group_name = f'chat_{min_id}_{max_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        history = await self.get_chat_history()
        await self.send(text_data=json.dumps({
            'type': 'history',
            'messages': history
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_text = data.get('message')
            
            if not message_text:
                return

            saved_message = await self.save_message(message_text)
            if not saved_message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Failed to save message',
                    'original_text': message_text
                }))
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': saved_message
                }
            )
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': message
        }))

    @database_sync_to_async
    def authenticate_token(self, token):
        try:
            validated_token = UntypedToken(token)
            user_id = validated_token['user_id']
            return User.objects.get(id=user_id)
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def get_chat_history(self):
        messages = ChatMessage.objects.filter(
            sender_id__in=[self.user.id, self.other_user_id],
            receiver_id__in=[self.user.id, self.other_user_id]
        ).order_by('-sent_at')[:50]
        
        # Reverse to chronological order
        return [
            {
                'id': msg.id,
                'sender': msg.sender_id,
                'receiver': msg.receiver_id,
                'message': msg.message,
                'sent_at': msg.sent_at.isoformat(),
                'is_read': msg.is_read
            }
            for msg in reversed(messages)
        ]

    @database_sync_to_async
    def save_message(self, message_text):
        try:
            msg = ChatMessage.objects.create(
                sender=self.user,
                receiver_id=self.other_user_id,
                message=message_text
            )
            return {
                'id': msg.id,
                'sender': msg.sender_id,
                'receiver': msg.receiver_id,
                'message': msg.message,
                'sent_at': msg.sent_at.isoformat(),
                'is_read': msg.is_read
            }
        except Exception:
            return None
