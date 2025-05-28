import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Paper
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

const EventParticipantsList = ({ participants }) => {
  if (!participants || participants.length === 0) {
    return (
      <Box my={2}>
        <Typography variant="body2" color="text.secondary">
          No participants
        </Typography>
      </Box>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ mt: 2 }}>
      <List>
        {participants.map((participant) => (
          <ListItem key={participant.id}>
            <ListItemAvatar>
              <Avatar>
                <PersonIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary={participant.full_name} 
              secondary={participant.email} 
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default EventParticipantsList; 