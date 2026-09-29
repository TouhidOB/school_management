import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function KPICard({ title, value, trend, trendValue, period }) {
  const isPositive = trend === 'up';
  
  return (
    <Card sx={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: isPositive ? '#10b981' : '#ef4444',
              bgcolor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {isPositive ? <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} /> : <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />}
            {trendValue}
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            vs {period}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
