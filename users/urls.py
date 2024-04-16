from django.urls import path
from . import views

urlpatterns = [
    path('register', views.UserRegister.as_view(), name='register'),
    path('login', views.UserLogin.as_view(), name='login'),
    path('logout', views.UserLogout.as_view(), name='logout'),
    path('user', views.UserDetail.as_view(), name='user'),
    path('userjournals', views.UserJournalList.as_view(), name='user_journals'),
    path('usermoods', views.UserMoodList.as_view(), name='user_moods'),
    path('aichat', views.UserChat.as_view(), name='ai_chat'),
    path('aichatsummary', views.UserChatSummary.as_view(), name='ai_chat_summary'),
    path('journalsummary', views.UserJournalSummary.as_view(), name='journal_summary'),
    path('journalsave', views.UserJournalSave.as_view(), name='journal_save'),
    path('moodlog', views.UserMoodLog.as_view(), name='mood_log'),
]