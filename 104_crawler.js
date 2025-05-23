const puppeteer = require('puppeteer');

// Replace the waitForTimeout line with a custom delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fs = require('fs');
const path = require('path');

// Get baseUrl from command line or use default
const baseUrl = process.argv[2];

// Validate URL format
if (!baseUrl.match(/^https:\/\/www\.104\.com\.tw\/company\//)) {
  console.error('Invalid URL format. URL must be a valid 104.com.tw company page');
  process.exit(1);
}

const allJobs = [];
const expLevels = ['經歷不拘'];
const eduLevels = ['碩士', '碩士以上', '大學', '大學以上', '專科', '專科以上'];

(async () => {
  try {

    const browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: [
        '--disable-web-security',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });
    
    const page = await browser.newPage();

    // Headers and user agent setup
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Function to scrape jobs from current page
    async function scrapeJobsFromPage() {
      return await page.$$eval('div.joblist__container .job-list-container', (containers, expLevels, eduLevels) => {
        let results = containers.map(container => {
          const infoTags = container.querySelectorAll('.info-tags__text');
          const secondTag = infoTags[1] ? infoTags[1].innerText.trim() : 'N/A';
          const thirdTag = infoTags[2] ? infoTags[2].innerText.trim() : 'N/A';
          const titleElement = container.querySelector('div.info-job');
          const title = titleElement ? titleElement.innerText.trim() : 'N/A';
          let link = container.querySelector('a.jb-link');
          link = link ? link?.href : 'N/A';

          return { title, link, secondTag, thirdTag };
        });

        if (expLevels && expLevels.length > 0) {
          results = results.filter(job => expLevels.includes(job.secondTag));
        }

        if (eduLevels && eduLevels.length > 0) {
          results = results.filter(job => eduLevels.includes(job.thirdTag));
        }

        return results;
      }, expLevels, eduLevels);
    }

    // Navigate to first page
    await page.goto(baseUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for select menu to load
    await page.waitForSelector(
      'select.form-control', { timeout: 10000 }
    );

    // Get total number of pages
    const totalPages = await page.$$eval(
      'select.form-control option', options => options.length
    );
    console.log(`Total pages found: ${totalPages}`);

    // Iterate through all pages
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        console.log(`Scraping page ${currentPage} of ${totalPages}`);
        
        if (currentPage > 1) {
          // Construct and navigate to next page URL
          const pageUrl = baseUrl.replace('page=1', `page=${currentPage}`);
          await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 10000 });
          await page.waitForSelector('div.joblist__container .job-list-container', { visible: true });
        }

        // Scrape jobs from current page
        const pageJobs = await scrapeJobsFromPage();
        allJobs.push(...pageJobs);
        
        // Optional: Add delay between pages
        await delay(2000);
    }

    // console.log(JSON.stringify(allJobs, null, 2)); // uncomment for debugging
    console.log(`${allJobs.length} jobs found`);

    await browser.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

    // Save results to CSV
    const csvHeader = 'Title,Link\n';
    const csvRows = allJobs.map(job => {
        // Escape commas and quotes in the title
        const sanitizedTitle = job.title.replace(/"/g, '""').replace(/,/g, '，');
        return `"${sanitizedTitle}","${job.link}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    const outputPath = path.join(__dirname, 'jobs.csv');
    
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`Results saved to: ${outputPath}`);  
})();