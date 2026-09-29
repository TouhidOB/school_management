"use client";

import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";

export default function CertificateTypesPage() {
  const types = [
    {
      title: "Testimonial",
      description: "A standard testimonial verifying the student's behavior and academic completion.",
      icon: <WorkspacePremiumIcon color="primary" />
    },
    {
      title: "Transfer Certificate",
      description: "An official document required when a student is transferring to another institution.",
      icon: <AssignmentReturnIcon color="secondary" />
    },
    {
      title: "Custom Certificate",
      description: "Any other custom achievement, award, or participation certificate.",
      icon: <CardMembershipIcon color="success" />
    }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Supported Certificate Types</Typography>
        <Typography variant="body2" color="text.secondary">
          The system currently supports the following built-in formats.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <List sx={{ p: 0 }}>
          {types.map((type, idx) => (
            <Box key={idx}>
              <ListItem sx={{ py: 3 }}>
                <ListItemIcon sx={{ mr: 2 }}>
                  {type.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={<Typography variant="subtitle1" fontWeight="bold">{type.title}</Typography>} 
                  secondary={type.description} 
                />
              </ListItem>
              {idx < types.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>
    </Box>
  );
}
