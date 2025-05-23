## HIGH PRIORITY

*   [ ] **Remove Dependency on drizzle-kit:** Refactor code to eliminate the use of drizzle-kit.
    * [ ] Research alternative ORM solutions
    * [ ] Create migration plan
    * [ ] Update database schema handling
*   [ ] **Remove Dependency on @sveltejs/kit:** Refactor code to eliminate the use of @sveltejs/kit.
    * [ ] Identify core SvelteKit features in use
    * [ ] Research alternative routing solutions
    * [ ] Plan progressive migration strategy
*   [x] **GitHub Pages Deployment:** Set up the project for GitHub Pages hosting.
    * [x] Configure GitHub repository settings
    * [x] Set up CI/CD workflow for automatic deployment
    * [x] Ensure static asset paths are compatible with GitHub Pages
    * [x] Update build configuration for GitHub Pages environment
    * [x] Fix server-side code issues for static deployment
*   [ ] **Docker Hub Integration for Card Scanner:** Upload the card_scanner as an independent app to Docker Hub.
    * [ ] Finalize Dockerfile configuration
    * [ ] Create Docker Hub account/organization
    * [ ] Set up automated builds
    * [ ] Document deployment and usage instructions
*   [ ] **Linode Deployment Setup:** Deploy the full application stack on Ubuntu Linode server.
    * [X] SSH setup and server preparation
    * [X] Install Docker and Docker Compose
    * [X] Clone repository to server
    * [ ] Create environment file with all required variables
    * [ ] Deploy with Docker Compose
    * [ ] Configure networking (firewall ports: 80/443, 5173, 5000)
    * [ ] Set up domain and SSL (optional for demo)
    * [ ] Monitor logs and application health
    * [ ] Backup strategy for PostgreSQL and Redis data


## MEDIUM PRIORITY

*   [ ] **Developer Experience**
    * [ ] Add API documentation using OpenAPI/Swagger
    * [ ] Improve development environment setup
    * [ ] Create contributor guidelines
*   [ ] **Linode Optimization**
    * [ ] Review resource usage and optimize container limits
    * [ ] Consider disabling Prometheus/Grafana for demo to save resources
    * [ ] Add container restart policies for improved reliability
    * [ ] Implement monitoring alerts for server resource constraints

## LOW PRIORITY

*   [ ] **Testing**
    * [ ] **Accessibility Tests:** Integrate accessibility testing into your CI/CD pipeline.
    * [ ] **Integration Tests:** Add more integration tests for critical flows.
    * [ ] **Load Testing:** Implement performance benchmarks.
*   [ ] **Performance Optimization**
    * [ ] **Code Splitting:** Split your code into smaller chunks for faster initial load times.
        * [x] Basic route-based code splitting with vite.config.js
        * [x] Dynamic imports for heavy components (CardScanner, DeckBuilder)
        * [x] Implement lazy loading for offscreen components
        * [x] Setup module preloading for critical paths
    * [ ] **Caching:** Implement caching strategies for frequently accessed data.
        * [x] Implement memory caching for Scryfall API data
        * [x] Set up service worker caching for offline support
        * [ ] Add IndexedDB storage for large dataset persistence
        * [ ] Implement advanced HTTP caching with ETag support
        * [ ] Set up stale-while-revalidate pattern for all API requests
    *   [x] **Image Optimization:** Add responsive images and lazy loading
        * [x] Implement image srcset for card images at multiple resolutions
        * [x] Add native lazy loading attribute to non-critical images
        * [x] Create blurred placeholders for card images during loading
        * [x] Set up an image optimization pipeline with vite-imagetools
        * [x] Implement progressive image loading for card art


## CONSISTENT UPKEEP

*   [ ] **Dependency Updates:** 
    * Weekly dependency audits
    * Monthly major version evaluations
    * Automated security patches
*   [ ] **Code Reviews:** 
    * Enforce code review guidelines
    * Use automated code quality checks
    * Regular tech debt assessment
*   [ ] **Performance Monitoring:**
    * Set up real user monitoring
    * Track core web vitals
    * Monitor API response times
*   [ ] **Security Audits:** 
    * Weekly automated scans
    * Monthly manual review
    * Quarterly penetration testing
*   [ ] **Database Maintenance:**
    * Daily automated backups
    * Weekly query optimization review
    * Monthly data cleanup
*   [ ] **Linode Server Maintenance:**
    * Weekly system updates
    * Monitor disk space usage
    * Check container health
    * Review logs for errors or unusual activity
