# Production Checklist

Complete checklist for deploying AI Image Generator to Hostinger VPS

## Pre-Deployment

- [ ] Domain name configured and pointing to VPS IP
- [ ] Hostinger VPS purchased and accessible via SSH
- [ ] Hugging Face API key obtained
- [ ] Repository ready (private or public)
- [ ] All sensitive data removed from code
- [ ] `.env` template created in deploy folder

## Deployment Setup

- [ ] SSH access tested to VPS
- [ ] Deployment scripts are executable (`chmod +x`)
- [ ] Latest code committed to git
- [ ] Build tested locally
- [ ] Database migrations prepared

## Deployment Execution

- [ ] Complete deployment script run successfully
- [ ] No errors during system setup
- [ ] Node.js installed correctly
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained

## Configuration

- [ ] `.env` file created with production values:
  - [ ] `NODE_ENV=production`
  - [ ] `HUGGINGFACE_API_KEY` set
  - [ ] `JWT_SECRET` set to secure random key
  - [ ] `API_URL` set to domain
  - [ ] `DATABASE_URL` set correctly
- [ ] CORS configuration updated for domain
- [ ] Rate limiting configured
- [ ] Logging configured

## Application Setup

- [ ] Dependencies installed: `npm install --legacy-peer-deps`
- [ ] Database initialized: `npm run db:migrate`
- [ ] Frontend built: `cd client && npm run build && cd ..`
- [ ] PM2 configured with ecosystem.config.js
- [ ] Application started with PM2
- [ ] PM2 processes saved and set to auto-start

## Nginx Configuration

- [ ] Domain name updated in Nginx config
- [ ] Nginx configuration tested: `sudo nginx -t`
- [ ] Nginx restarted successfully
- [ ] HTTP to HTTPS redirect working
- [ ] Rate limiting rules configured

## SSL/TLS

- [ ] SSL certificate obtained from Let's Encrypt
- [ ] Certificate auto-renewal configured
- [ ] Certificate paths correct in Nginx
- [ ] HTTPS working and accessible
- [ ] Certificate will renew automatically

## Security

- [ ] Firewall configured (ufw/iptables)
- [ ] SSH hardened:
  - [ ] Root login disabled
  - [ ] Password auth disabled
  - [ ] Only key-based auth enabled
- [ ] Fail2Ban configured
- [ ] Security headers set in Nginx
- [ ] CORS properly restricted
- [ ] API rate limiting enabled

## Monitoring & Logs

- [ ] PM2 logs accessible
- [ ] Nginx logs monitored
- [ ] System resources checked (CPU, RAM, disk)
- [ ] Log rotation configured
- [ ] Error monitoring set up

## Testing

- [ ] API health check working: `curl https://your-domain.com/api/health`
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can generate image
- [ ] Can view gallery
- [ ] Mobile responsive working
- [ ] Different browsers tested

## Performance

- [ ] Page load times acceptable
- [ ] Image generation working
- [ ] Database queries optimized
- [ ] Caching configured
- [ ] Compression enabled (gzip)
- [ ] Static assets cached

## Backup & Recovery

- [ ] Database backup procedure documented
- [ ] Automated backup script created
- [ ] Backup tested and verified
- [ ] Recovery procedure documented
- [ ] Disaster recovery plan in place

## Documentation

- [ ] Deployment documented
- [ ] Commands documented
- [ ] Troubleshooting guide created
- [ ] Team informed of access credentials
- [ ] Runbook created

## Post-Deployment

- [ ] Application monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Email alerts configured
- [ ] Team notified of live deployment
- [ ] Status page created (optional)

## Maintenance Schedule

- [ ] Daily: Monitor logs and performance
- [ ] Weekly: Check disk space and backups
- [ ] Monthly: Review security logs
- [ ] Quarterly: Update dependencies
- [ ] Yearly: Security audit

## Domain & DNS

- [ ] A record points to VPS IP
- [ ] AAAA record configured (IPv6 optional)
- [ ] MX records configured (if using email)
- [ ] TXT records for verification
- [ ] DNS TTL set appropriately

## Database

- [ ] Database located at `/var/www/ai-image-generator/data/`
- [ ] Proper backup system in place
- [ ] Automated backup script running
- [ ] Regular integrity checks scheduled
- [ ] Recovery procedure tested

## Application Updates

- [ ] Git configured for auto-pull
- [ ] Update procedure documented
- [ ] Zero-downtime update process tested
- [ ] Rollback procedure documented
- [ ] Team knows how to update

## Scalability (Future)

- [ ] Load testing performed
- [ ] Horizontal scaling plan prepared
- [ ] Database scaling strategy defined
- [ ] CDN integration documented
- [ ] Cache layer planned (Redis optional)

## Final Verification

- [ ] All critical services running
- [ ] All users can access application
- [ ] API responding correctly
- [ ] Database accessible
- [ ] Logs being generated
- [ ] Backups being created
- [ ] Certificates valid
- [ ] Firewall rules in place
- [ ] All scripts executable
- [ ] Team trained on procedures

## Go-Live Sign-Off

- [ ] Product Owner approval: _____________ Date: _______
- [ ] DevOps Lead approval: _____________ Date: _______
- [ ] Security Review: _____________ Date: _______
- [ ] Performance Approved: _____________ Date: _______

---

## Post-Launch Monitoring (First 7 Days)

- [ ] Day 1: Hourly checks for errors
- [ ] Days 2-3: Monitor for unusual patterns
- [ ] Days 4-7: Daily monitoring, look for trends
- [ ] Throughout: Monitor user feedback
- [ ] Keep team on standby for issues

---

## Rollback Plan

If critical issues occur:

1. **Immediate**: Stop serving traffic to problematic version
2. **Investigation**: Check logs and determine root cause
3. **Rollback**: Revert to last known good version
4. **Testing**: Verify rollback version works
5. **Communication**: Update stakeholders
6. **Root Cause Analysis**: Fix issue before re-deploying

---

**Status: Ready for Launch ✓**

Once all items are checked, your production deployment is ready!
