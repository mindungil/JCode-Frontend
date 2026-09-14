import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 1.5,
        px: 2,
        mt: 'auto',
        backgroundColor: 'transparent',
        borderTop: 'none',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'JetBrains Mono', 'Noto Sans KR', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                color: 'text.primary'
              }}
            >
              JCode
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.7rem',
              }}
            >
              © {currentYear} JEduTools. All rights reserved.
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.7rem',
              }}
            >
              v2.0.1
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Link
              href="https://jedutools.jbnu.ac.kr"
              target="_blank"
              rel="noopener"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': {
                  color: (theme) => theme.palette.primary.main
                }
              }}
            >
              OSLAB
            </Link>
            {/* <Link
              href="https://www.jbnu.ac.kr/kor/?menuID=139"
              target="_blank"
              rel="noopener"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': {
                  color: (theme) => theme.palette.primary.main
                }
              }}
            >
              개인정보처리방침
            </Link> */}
            <Link
              href="https://csai.jbnu.ac.kr/csai/index.do"
              target="_blank"
              rel="noopener"
              sx={{
                color: 'text.secondary',
                fontSize: '0.7rem',
                textDecoration: 'none',
                transition: 'color 0.2s',
                '&:hover': {
                  color: (theme) => theme.palette.primary.main
                }
              }}
            >
              전북대 컴퓨터인공지능학부
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
