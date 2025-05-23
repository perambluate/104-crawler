# 104 Job Crawler

In the company pages on 104, there are only filters for job categories and regions.
Lack of filters for experience levels annoys me to check all the page lists one-by-one.
That's why this small project comes out.

> This script was originally prototyped with help from ChatGPT (GPT-4) and later refined and debugged.

## Prerequisite
- Puppeteer
Install it with `npm install puppeteer`

## Usage
1. Change `baseUrl` to the company pages with pre-checked filters for job categories and regions.
2. Modify `expLevels` to the level u want.
3. Run the script: `node 104_crawler.js "https://www.104.com.tw/company/${company_id}?roleJobCat=${job_filter_ids}&page=1&pageSize=20&order=99&asc=0&tab=job#info06"`.
> Change the argument `https://www.104.com.tw/company/${company_id}?roleJobCat=${job_filter_ids}&page=1&pageSize=20&order=99&asc=0&tab=job#info06` to the url of filtered job opportunities in the company's page u want to further filter.