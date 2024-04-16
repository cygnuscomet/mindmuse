from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate

UserModel = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = '__all__'
    def create(self, validated_data):
        user_obj = UserModel.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )
        user_obj.save()
        return user_obj    

class UserLoginSerializer(serializers.Serializer):

    def check_user(self, validated_data):
        user = authenticate(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ['email', 'username']