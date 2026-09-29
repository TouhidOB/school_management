"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, IconButton, Badge, Typography, Avatar, Tooltip, InputBase, Popper, Paper, List, ListItem, ListItemText, Divider, CircularProgress } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsSystemDaydreamIcon from '@mui/icons-material/SettingsSystemDaydream';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { api } from "@/lib/api";

export default function SuperAdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ schools: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchAnchorRef = useRef(null);
  
  // Basic breadcrumb derived from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const title = pathParts.length > 1 
    ? pathParts[pathParts.length - 1].replace(/-/g, ' ') 
    : 'Dashboard';
    
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults({ schools: [], users: [] });
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setIsSearching(true);
    setShowResults(true);
    try {
      const res = await api.get(`/platform/search/?q=${encodeURIComponent(query)}`);
      setSearchResults(res || { schools: [], users: [] });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setSearchQuery('');
    if (type === 'School') {
      router.push(`/platform/tenants/${id}`);
    } else if (type === 'User') {
      router.push(`/platform/users/`); // Or appropriate user detail view
    }
  };

  return (
    <Box 
      component="header" 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 3, 
        py: 1.5,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '30%' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
            {formattedTitle}
          </Typography>
          {pathParts.length > 1 && (
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Admin / {pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')}
            </Typography>
          )}
        </Box>
      </Box>

      <Box 
        ref={searchAnchorRef}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: '#f1f5f9', 
          borderRadius: 2, 
          px: 2, 
          py: 0.5,
          width: '40%',
          maxWidth: 500,
          position: 'relative'
        }}
      >
        <SearchIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
        <InputBase
          placeholder="Global search (Schools, Users...)"
          sx={{ ml: 1, flex: 1, fontSize: '0.875rem' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchQuery.length >= 2) setShowResults(true) }}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {isSearching && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Box>
      
      <Popper 
        open={showResults} 
        anchorEl={searchAnchorRef.current} 
        placement="bottom-start"
        style={{ width: searchAnchorRef.current?.clientWidth, zIndex: 1300 }}
      >
        <Paper elevation={4} sx={{ mt: 1, maxHeight: 400, overflow: 'auto', borderRadius: 2 }}>
          {searchResults.schools?.length === 0 && searchResults.users?.length === 0 && !isSearching ? (
            <Box sx={{ p: 2, textAlign: 'center', color: '#64748b' }}>
              <Typography variant="body2">No results found for "{searchQuery}"</Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0, pb: 0 }}>
              {searchResults.schools?.length > 0 && (
                <>
                  <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">SCHOOLS</Typography>
                  </Box>
                  {searchResults.schools.map((school) => (
                    <ListItem button key={`school-${school.id}`} onClick={() => handleResultClick('School', school.id)}>
                      <ListItemText 
                        primary={school.title} 
                        secondary={school.subtitle}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                  <Divider />
                </>
              )}
              {searchResults.users?.length > 0 && (
                <>
                  <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1 }}>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">USERS</Typography>
                  </Box>
                  {searchResults.users.map((u) => (
                    <ListItem button key={`user-${u.id}`} onClick={() => handleResultClick('User', u.id)}>
                      <ListItemText 
                        primary={u.title} 
                        secondary={u.subtitle}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </>
              )}
            </List>
          )}
        </Paper>
      </Popper>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '30%', justifyContent: 'flex-end' }}>
        <LanguageToggle size="small" />

        <Tooltip title="System Status: All Operational">
          <IconButton sx={{ color: '#10b981' }}>
            <SettingsSystemDaydreamIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Notifications">
          <IconButton sx={{ color: '#64748b' }}>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Help & Documentation">
          <IconButton sx={{ color: '#64748b' }}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#3b82f6', fontSize: '0.875rem' }}>
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
}
