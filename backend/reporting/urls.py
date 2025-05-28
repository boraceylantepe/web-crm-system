from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReportTemplateViewSet, 
    GeneratedReportViewSet,
    AnalyticsViewSet, 
    ReportScheduleViewSet
)

app_name = 'reporting'

router = DefaultRouter()
router.register(r'templates', ReportTemplateViewSet, basename='reporttemplate')
router.register(r'reports', GeneratedReportViewSet, basename='generatedreport')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'schedules', ReportScheduleViewSet, basename='reportschedule')

urlpatterns = [
    path('', include(router.urls)),
] 