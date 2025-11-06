import AdvancedAnalyticsService from '../../../src/services/AdvancedAnalyticsService';
import EngagementTracker from '../../../src/services/EngagementTracker';

/**
 * API endpoint for engagement analytics reports
 * Returns comprehensive engagement data and improvement metrics
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeframe = '7d' } = req.query;
    
    // Initialize analytics services
    const analyticsService = new AdvancedAnalyticsService(global.database);
    const engagementTracker = new EngagementTracker(analyticsService);
    
    // Generate comprehensive engagement report
    const report = await analyticsService.generateEngagementReport(timeframe);
    const aiImpactAnalysis = await engagementTracker.generateAIImpactAnalysis(timeframe);
    
    // Combine data for frontend
    const response = {
      timeframe,
      generatedAt: new Date().toISOString(),
      
      // Summary metrics
      summary: {
        totalMessages: report.summary?.totalMessages || 0,
        activeUsers: report.summary?.activeUsers || 0,
        aiProcessedMessages: report.summary?.aiProcessedMessages || 0,
        averageResponseTime: report.summary?.averageResponseTime || 0,
        averageEngagement: report.summary?.averageEngagement || 0,
        taskCompletionRate: report.summary?.taskCompletionRate || 0,
        userSatisfactionRate: report.summary?.userSatisfactionRate || 0
      },
      
      // Improvement metrics
      improvements: {
        messageGrowth: report.improvements?.messageGrowth || 0,
        userGrowth: report.improvements?.userGrowth || 0,
        responseTimeImprovement: report.improvements?.responseTimeImprovement || 0,
        engagementImprovement: report.improvements?.engagementImprovement || 0,
        taskCompletionImprovement: report.improvements?.taskCompletionImprovement || 0,
        satisfactionImprovement: report.improvements?.satisfactionImprovement || 0
      },
      
      // Detailed metrics
      metrics: report.metrics || {},
      
      // AI impact data
      aiImpact: aiImpactAnalysis || {},
      
      // Recommendations
      recommendations: report.recommendations || [],
      
      // Success indicators
      success: true,
      dataQuality: assessDataQuality(report)
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({
      error: 'Failed to generate analytics report',
      message: error.message,
      success: false
    });
  }
}

/**
 * Assess the quality and completeness of analytics data
 */
function assessDataQuality(report) {
  const quality = {
    score: 0,
    issues: [],
    completeness: 0
  };
  
  // Check data completeness
  const requiredFields = ['summary', 'improvements', 'metrics'];
  const presentFields = requiredFields.filter(field => report[field]);
  quality.completeness = presentFields.length / requiredFields.length;
  
  // Calculate quality score
  if (report.summary?.totalMessages > 0) quality.score += 25;
  if (report.summary?.activeUsers > 0) quality.score += 25;
  if (report.improvements) quality.score += 25;
  if (report.metrics) quality.score += 25;
  
  // Identify issues
  if (quality.completeness < 1) {
    quality.issues.push('Incomplete data detected');
  }
  if (report.summary?.totalMessages === 0) {
    quality.issues.push('No message data available');
  }
  
  return quality;
}