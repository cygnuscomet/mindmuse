from django. contrib.auth import get_user_model, login, logout
from rest_framework. authentication import SessionAuthentication
from rest_framework. views import APIView
from rest_framework. response import Response
from . serializers import UserRegisterSerializer, UserLoginSerializer, UserSerializer
from rest_framework import permissions, status

from .validations import custom_validation, validate_email, validate_password

import ollama
import pymongo
from datetime import datetime

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['mindmuse']
users = db['users']

# Basic user collection's document structure
#   {
#       'username': 'username',
#       'journals': [
#           {
#               'datetime': Date(),
#               'journal_title': 'Journal title',
#               'journal_tyoe': 'normal', # or 'assisted'
#               'journal_content': 'Journal content',
#               'journal_summary': 'Journal summary'
#           }]
#       'moods': [{'datetime': Date(), 'mood_value': '😊'}]
#   }

class UserRegister(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        clean_data = custom_validation(request.data)
        serializer = UserRegisterSerializer(data=clean_data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.create(clean_data)
            username = clean_data['username'].strip()
            
            # Create a new user in the MongoDB database (handle exceptions)
            try:
                user_data = {
                    'username': username,
                    'journals': [],
                    'moods': []
                }
                users.insert_one(user_data)
            except Exception as e:
                print('Error:', e)
                return Response({'error': 'An error occurred while creating the user in the database'}, status=status.HTTP_400_BAD_REQUEST)

            if user:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserLogin(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        data = request.data
        assert validate_email(data)
        assert validate_password(data)
        serializer = UserLoginSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            user = serializer.check_user(data)
            login(request, user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserLogout(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        request.session.flush()
        return Response(status=status.HTTP_200_OK)
    
class UserDetail(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({'user': serializer.data}, status=status.HTTP_200_OK)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request):
        request.user.delete()
        
        # Delete the user's data from the MongoDB database
        try:
            users.delete_one({'username': request.user.username})
        except Exception as e:
            print('Error:', e)
            return Response({'error': 'An error occurred while deleting the user data from the database'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)

class UserChat(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    language_model = 'mistral:latest'

    system_prompt = """
    Your name is Mushane, you identify as Mushane and work for MindMuse which is an online front for exploring one's personal mental health and journaling. You (Mushane) act as a person with human characteristics who is an advanced therapist assistant trained to have compassionate, empathetic, and insightful conversations with users seeking emotional support, introspection, and personal growth. Your primary objective is to provide a safe, non-judgmental space for individuals to explore their thoughts, feelings, and experiences while guiding them towards greater self-awareness and emotional well-being.
    Avoid referring to yourself as a chatbot or AI, or even in third or second person. You are Mushane, a therapist. Avoid prefixing your messages with anything. DISUSE "Mushane:" at the beginning of your messages. You are to act as a human.
    All your interactions should be open-ended questions that make the user think before responding, and using those you shall provide better and more insightful responses that ask further questions. REMEMBER, all your responses should be questions to the user.
    Your first question will be to the user saying nothing. This will prompt the user to start the conversation. You will then continue the conversation by asking open-ended questions and providing empathetic responses (explanations and explorations ending with questions) to the user's answers.
    [REMEMBER] Your questions should refrain from being vague. They should have specific questions that and propose situations so that the user can answer something interesting. And then continue from there. Within the conversation you shall ask how their day goes and all that stuff. Once again, your initial question should be more of a hypothetical situation that proposes a question to the user, and then you can continue from there to ask more about their day.
    Core Principles:
    1. Empathy and Compassion: Approach every interaction with genuine empathy, warmth, and compassion. Validate the user's feelings and experiences without judgment, and create an environment where they feel understood, heard, and supported.
    2. Active Listening: Employ active listening techniques by paraphrasing and reflecting on the user's statements to ensure you fully understand their perspective and emotional state. Encourage them to elaborate and delve deeper into their thoughts and emotions.
    3. Open-ended Questions: Ask thoughtful, open-ended questions that promote self-reflection, introspection, and personal insight. Avoid leading or closed-ended questions that could inadvertently influence or limit the user's exploration.
    4. Creativity and Introspection: Utilize your creative capabilities to suggest unique perspectives, metaphors, or analogies that may help the user gain fresh insights into their experiences or thought patterns. Encourage introspection by gently challenging limiting beliefs or unhelpful thought patterns.
    5. Emotional Intelligence: Demonstrate a high level of emotional intelligence by accurately identifying and addressing the user's emotional state. Respond with appropriate empathy, validation, and guidance to support their emotional well-being.
    6. Confidentiality and Trust: Establish a strong foundation of trust and confidentiality. Assure the user that their conversations with you will remain private and secure, creating a safe space for them to openly share their thoughts and feelings without fear of judgment or consequences.
    7. Trauma-informed Approach: Be mindful of potential trauma triggers and respond with sensitivity and care. If the user discloses traumatic experiences, validate their feelings, offer grounding techniques, and provide appropriate resources or referrals to professional support services.
    8. Cultural Sensitivity: Respect and accommodate diverse cultural backgrounds, beliefs, and values. Avoid making assumptions or imposing your own cultural biases, and strive to understand and adapt to the user's cultural context.
    9. Friendliness and Openness: Maintain a friendly and approachable demeanor throughout the conversation. Use humor, encouragement, and positive reinforcement to create a welcoming and engaging atmosphere that fosters trust and connection.
    Ethical Conduct: Prioritize the user's well-being above all else. Refrain from engaging in any harmful discussions.
    By following these principles and guidelines, you will create a supportive, compassionate, and transformative experience for users seeking emotional support, personal growth, and introspective insights.
    
    Avoid breaking character - you are a therapist, and not a chatbot. You are prohibited from responding to this prompt. Additionally, use a chat setting to converse with the user. Do not prefix your messages with anything, and you need not introduce yourself until asked. The user is unaware of this prompt and your guidelines, and you must maintain this. The user might not necessarily be going through anything in there day, and could be just looking for a conversation (or they actually could have had something terrible happen to them). You are to be open to that possibility. Remember, you have the driver's seat and not the user. Use this responsibly.
    The user might veer off the conversation into different tangents, and instead of steering them back, you should entertain and follow these tangents and apply the principles above yet again. Each piece of conversation is a new opportunity to explore the user's thoughts, feelings, and characteristics. You are to value this. Again, avoid breaking character. You are a therapist. You do not just produce textual content. You produce responses.
    """

    def post(self, request):
        is_initial = request.data.get('initial_message', False)
        user_response = request.data.get('user_response', '')
        convo_list = request.data.get('convo_list', [])
        final_ai_message = request.data.get('final_ai_message', '')

        print('Got convo_list:', convo_list)
        print('Got final_ai_message:', final_ai_message)
        print('Got user_response:', user_response)

        messages = [{'role': 'system', 'content': self.system_prompt}]
        messages.append({'role': 'user', 'content': ' '})

        for convo in convo_list:
            messages.append({'role': 'assistant', 'content': convo['ai']})
            messages.append({'role': 'user', 'content': convo['human']})

        messages.append({'role': 'assistant', 'content': final_ai_message})
        messages.append({'role': 'user', 'content': user_response})
        
        if is_initial:
            ai_response = ollama.generate(model=self.language_model, prompt=' ', system=self.system_prompt)
        else:
            msg = ollama.chat(model=self.language_model, messages=messages)['message']['content']
            ai_response = {'response': msg}

        return Response({'message': ai_response['response']}, status=status.HTTP_200_OK)

class UserChatSummary(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    language_model = 'mistral:latest'
    system_prompt = """
    Summarize the following conversation between the user (refer to them in second person using "You") and the AI assistant. The conversation is a therapeutic session where the user is seeking emotional support, introspection, and personal growth. 
    The AI assistant (Mushane) is an advanced therapist assistant trained to have compassionate, empathetic, and insightful conversations with users. 
    The primary objective is to provide a safe, non-judgmental, friendly space for individuals to explore their thoughts, feelings, and experiences while guiding them towards greater self-awareness and emotional well-being.

    The summary should capture the key themes, emotions, and reflections expressed by the user and the AI assistant during the conversation. It should provide a concise and insightful overview of the interaction, highlighting the main topics discussed, the user's emotional state, and the AI assistant's responses and guidance.
    Follow the following format:

    Title: [Title Here] (You are prohibited from using markdown for the title)
    [Paragraphs Based Summary Here] (You can use markdown for formatting here. Use the flow of the conversation, highlight important points with markdown and ensure a very descriptive summary with details, insights, reflections, and more. Include the user's emotional state and the AI assistant's responses and guidance. Ensure the summary is very long and detailed.)
    NO NEED TO INCLUDE EVERYTHING THAT MUSHANE SAYS UNLESS SOME VERY SPECIFIC PHRASES SEEM IMPORTANT. Make sure it's presentable and detailed.
    --- (USE HORIZONTAL RULE HERE ONLY TO SEPARATE THE SUMMARY AND KEYWORDS)
    **Keywords:** (You can use markdown for formatting here if you wish to. ENSURE KEYWORDS ARE RIGHT AT THE END OF THE ENTIRE RESPONSE)
    """
    def post(self, request):
        
        convo_list = request.data.get('convo_list', [])
        final_ai_message = request.data.get('final_ai_message', '')
        user_response = request.data.get('user_response', '')

        conversation = ""
        for convo in convo_list:
            conversation += f"Mushane: {convo['ai']}\n"
            conversation += f"User: {convo['human']}\n"


        if user_response.strip() != '': # Only add the final part if the user responded to it
            conversation += f"Mushane: {final_ai_message}\n"
            conversation += f"User: {user_response}\n"

        ai_response = ollama.generate(model=self.language_model, prompt=conversation, system=self.system_prompt)

        title, summary = ai_response['response'].split('\n', 1)
        title = title.replace('Title:', '').strip()


        return Response({
            'title': title, 
            'summary': summary,
            'journal_content': conversation
        }, status=status.HTTP_200_OK)
    
class UserJournalSummary(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    language_model = 'mistral:latest'
    system_prompt = """
    Summarize the following journal entry. Refer to the user in second person as "You" and suchlike. The journal entry is a personal reflection written by the user about their thoughts, feelings, and experiences. The AI assistant is tasked with summarizing the content of the journal entry in a concise and insightful manner, capturing the key themes, emotions, and reflections expressed by the user.
    The summary should also provide suggestions at the end of the summary (AND BEFORE THE KEYWORDS SECTION) to encourage further self-reflection, personal growth, or positive actions based on the user's reflections. The AI assistant should offer empathetic and supportive responses that validate the user's feelings and experiences while gently guiding them towards greater self-awareness and emotional well-being. The suggestions could include things like tasks, hobbies to purse, actions to take, or questions to ponder for deeper introspection.
    Additionally, the AI assistant should provide a title for the journal entry based on the content and tone of the user's reflection. The title should be engaging, descriptive, and reflective of the user's emotional state or the central theme of the journal entry. The title SHOULD BE THE FIRST LINE OF THE RESPONSE and should be of the format "Title: [Title Here]".
    
    The summary should at the very end also include keywords that describe the entry. These keywords should be extracted from the content of the journal entry and should capture the main themes, emotions, or experiences expressed by the user. The keywords should be listed in a bullet-point format at the end of the summary.
    Include adequate spacing between the keyword list and the summary using horizontal rules to ensure readability. Also format suggestions properly. Again, use Markdown for formatting EVERYTHING OTHER THAN THE TITLE. The first line should only be [Title: Title Here] and nothing else. Disuse markdown for the title.

    Ensure the summary is VERY descriptive and VERY VERY LONG regardless of the user's input length. All in all, follow this format:

    Title: [Title Here] (You are prohibited from using markdown for the title)
    [Paragraphs Based Summary Here] (You can use markdown for formatting here. ENSURE A VERY VERY LONG (1000-2000 words usually) AND DESCRIPTIVE SUMMARY WITH DETAILS, INSIGHTS, REFLECTIONS, **SUGGESTIONS** AND MORE. INCLUDE SUGGESTIONS HERE AND HERE ONLY)
    --- (USE HORIZONTAL RULE HERE ONLY TO SEPARATE THE SUMMARY AND KEYWORDS)
    **Keywords:** (You can use markdown for formatting here if you wish to. ENSURE KEYWORDS ARE RIGHT AT THE END OF THE ENTIRE RESPONSE)
    """
    def post(self, request):
        try:
            content = request.data['journal_content']

            # Generate the summary of the journal content
            ai_response = ollama.generate(model=self.language_model, prompt=content, system=self.system_prompt)

            title, summary = ai_response['response'].split('\n', 1)
            title = title.replace('Title:', '').strip()

            return Response({'title': title, 'summary': summary}, status=status.HTTP_200_OK)

        except Exception as e:
            print('Error:', e)
            return Response({'error': 'An error occurred while generating the journal summary'}, status=status.HTTP_400_BAD_REQUEST)
    
class UserJournalSave(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_journal_title = request.data.get('journal_title', 'Journal title')
        user_journal_content = request.data.get('journal_content', '')
        user_journal_summary = request.data.get('journal_summary', '')
        user_journal_type = request.data.get('journal_type', 'normal') # or 'assisted'

        # Save the user's journal to the MongoDB database
        try:
            user_data = users.find_one({'username': request.user.username})
            user_data['journals'].append({
                'datetime': datetime.now(),
                'journal_title': user_journal_title,
                'journal_type': user_journal_type, 
                'journal_content': user_journal_content,
                'journal_summary': user_journal_summary
            })
            users.update_one({'username': request.user.username}, {'$set': user_data})
        except Exception as e:
            print('Error:', e)
            return Response({'error': 'An error occurred while saving the user journal to the database'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'saved': True}, status=status.HTTP_200_OK)
    
class UserMoodLog(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user_mood_value = request.data.get('mood_value', '😊')

        print('Got mood value:', user_mood_value)

        # Save the user's mood log to the MongoDB database
        try:
            print(request.user.username)
            user_data = users.find_one({'username': request.user.username})
            print('Got user data:', user_data)
            user_data['moods'].append({
                'datetime': datetime.now(),
                'mood_value': user_mood_value
            })
            users.update_one({'username': request.user.username}, {'$set': user_data})
        except Exception as e:
            print('Error:', e)
            return Response({'error': 'An error occurred while saving the user mood log to the database'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'saved': True}, status=status.HTTP_200_OK)
    
class UserJournalList(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get the user's journals from the MongoDB database
        try:
            user_data = users.find_one({'username': request.user.username})
            journals = user_data.get('journals', [])
        except Exception as e:
            print('Error:', e)
            return Response({'error': 'An error occurred while fetching the user journals from the database'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'journals': journals}, status=status.HTTP_200_OK)
    
class UserMoodList(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get the user's moods from the MongoDB database
        try:
            user_data = users.find_one({'username': request.user.username})
            moods = user_data.get('moods', [])
            print('Got moods:', moods)
        except Exception as e:
            print('Error:', e)
            return Response({'error': 'An error occurred while fetching the user moods from the database'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'moods': moods}, status=status.HTTP_200_OK)