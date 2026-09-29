"use client";

import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import { useRouter } from "next/navigation";

export default function BranchesPage() {
  const router = useRouter();

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Manage Branches</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure multi-campus operations across your school network.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AddBusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Multi-Branch Support
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 3 }}>
            To add another campus or branch, you must register a new tenant through the Platform Console. 
            Once registered, it will be linked to your main administrative account.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => router.push('/platform/tenants')}
          >
            Go to Platform Console
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
