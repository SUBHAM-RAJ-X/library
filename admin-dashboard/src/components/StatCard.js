import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from '@mui/material';

const StatCard = ({ title, value, icon, color, subtitle }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}
            </Typography>
            <Typography color="textSecondary" variant="caption">
              {subtitle}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
