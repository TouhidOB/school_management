"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { AppBar, Toolbar, Typography, Button, Chip, Box, Select, MenuItem, InputBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import GridOnIcon from '@mui/icons-material/GridOn';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'text.secondary',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export default function TopBar() {
  const { user, school, exitSchool } = useAuth();
  const { t } = useLanguage();
  const isSuper = user?.is_super_admin;
  
  // Local state for interactive top bar elements
  const [branch, setBranch] = useState("main");
  const [academicYear, setAcademicYear] = useState("2026");
  const [term, setTerm] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      console.log('Searching for:', searchQuery);
      alert(`Search initiated for: ${searchQuery}`);
    }
  };

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon color="primary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {school ? school.name : t('nav.noSchool')}
          </Typography>
          {isSuper && school && (
            <Chip 
              icon={<SecurityIcon />} 
              label={t('nav.superAdminChip')} 
              color="warning" 
              size="small" 
              sx={{ ml: 1 }} 
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon fontSize="small" />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder={t('nav.searchPlaceholder')}
              inputProps={{ 'aria-label': 'search' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
          </Search>

          <LanguageToggle size="small" sx={{ mr: 1.5 }} />

          <Button sx={{ minWidth: 'auto', mr: 2, color: 'text.secondary' }} onClick={() => alert('Notifications coming soon!')}>
            <NotificationsIcon />
          </Button>

          {isSuper && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                component={Link}
                href="/platform"
                variant="outlined"
                size="small"
                startIcon={<GridOnIcon />}
              >
                {t('nav.platformConsole')}
              </Button>
              {school && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={exitSchool}
                  startIcon={<ExitToAppIcon />}
                >
                  {t('nav.exitSchool')}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Toolbar>
      
      {/* Global Context Bar */}
      {school && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: 3, 
          py: 1, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          backgroundColor: '#f8fafc',
          gap: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">{t('nav.branch')}:</Typography>
            <Select
              size="small"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              sx={{ 
                height: 30, 
                fontSize: '0.875rem',
                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                backgroundColor: 'transparent',
                fontWeight: 600
              }}
            >
              <MenuItem value="main">Main Campus</MenuItem>
              <MenuItem value="north">North Campus</MenuItem>
            </Select>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">{t('nav.academicYear')}:</Typography>
            <Select
              size="small"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              sx={{ 
                height: 30, 
                fontSize: '0.875rem',
                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                backgroundColor: 'transparent',
                fontWeight: 600
              }}
            >
              <MenuItem value="2026">2026</MenuItem>
              <MenuItem value="2025">2025</MenuItem>
            </Select>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">{t('nav.term')}:</Typography>
            <Select
              size="small"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              sx={{ 
                height: 30, 
                fontSize: '0.875rem',
                '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                backgroundColor: 'transparent',
                fontWeight: 600
              }}
            >
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
              <MenuItem value="3">3</MenuItem>
            </Select>
          </Box>
        </Box>
      )}
    </AppBar>
  );
}
