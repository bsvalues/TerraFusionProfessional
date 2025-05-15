/**
 * Report Worker
 * Worker thread for generating reports
 */
const { parentPort, workerData } = require('worker_threads');
const { join } = require('path');
const fs = require('fs').promises;
const { jsPDF } = require('jspdf');

// Get worker configuration
const { workerId, baseTempPath, baseOutputPath } = workerData;

// Template cache
const templateCache = new Map();

// Signal that worker is ready
parentPort.postMessage({
  type: 'worker_ready',
  workerId
});

// Listen for messages from main thread
parentPort.on('message', async (message) => {
  const { type, job } = message;
  
  if (type === 'process_job') {
    try {
      const result = await processJob(job);
      
      parentPort.postMessage({
        type: 'job_completed',
        jobId: job.id,
        result
      });
    } catch (error) {
      console.error(`Worker ${workerId} error processing job ${job.id}:`, error);
      
      parentPort.postMessage({
        type: 'job_failed',
        jobId: job.id,
        result: {
          error: error.message || 'Unknown error'
        }
      });
    }
  }
});

/**
 * Process a report generation job
 */
async function processJob(job) {
  console.log(`Worker ${workerId} processing job ${job.id}`);
  
  // Create temp directory for this job
  const jobTempDir = join(baseTempPath, job.id);
  await fs.mkdir(jobTempDir, { recursive: true });
  
  try {
    // Generate report based on type
    let outputPath;
    
    switch (job.type) {
      case 'urar':
        outputPath = await generateUrarReport(job, jobTempDir);
        break;
      case 'market_analysis':
        outputPath = await generateMarketAnalysisReport(job, jobTempDir);
        break;
      case 'property_card':
        outputPath = await generatePropertyCardReport(job, jobTempDir);
        break;
      case 'comps_grid':
        outputPath = await generateCompsGridReport(job, jobTempDir);
        break;
      case 'custom':
        outputPath = await generateCustomReport(job, jobTempDir);
        break;
      default:
        throw new Error(`Unsupported report type: ${job.type}`);
    }
    
    // Return result
    return {
      outputPath
    };
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(jobTempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean up temp directory for job ${job.id}:`, error);
    }
  }
}

/**
 * Generate URAR (Uniform Residential Appraisal Report) format
 */
async function generateUrarReport(job, tempDir) {
  // Create output directory
  const outputDir = join(baseOutputPath, 'urar', job.userId.toString());
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate PDF file path
  const outputPath = join(outputDir, `${job.id}.pdf`);
  
  // Simulate PDF generation with jsPDF
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(16);
  doc.text('Uniform Residential Appraisal Report', 105, 20, { align: 'center' });
  
  // Add property information
  doc.setFontSize(12);
  doc.text(`Property Address: ${job.data.property.address}`, 20, 40);
  doc.text(`City: ${job.data.property.city}`, 20, 50);
  doc.text(`State: ${job.data.property.state}`, 20, 60);
  doc.text(`Zip Code: ${job.data.property.zipCode}`, 20, 70);
  
  // Add appraisal information
  doc.text(`Appraiser: ${job.data.appraiser.name}`, 20, 90);
  doc.text(`Effective Date: ${job.data.effectiveDate}`, 20, 100);
  doc.text(`Market Value: $${job.data.marketValue.toLocaleString()}`, 20, 110);
  
  // Add comparable sales section if available
  if (job.data.comparables && job.data.comparables.length > 0) {
    doc.text('Comparable Sales', 105, 140, { align: 'center' });
    
    let y = 160;
    job.data.comparables.forEach((comp, index) => {
      doc.text(`Comparable ${index + 1}: ${comp.address}`, 20, y);
      doc.text(`Sale Price: $${comp.salePrice.toLocaleString()}`, 40, y + 10);
      doc.text(`Sale Date: ${comp.saleDate}`, 40, y + 20);
      y += 40;
    });
  }
  
  // Add footer with page number
  doc.setFontSize(10);
  doc.text(`Report ID: ${job.id}`, 20, 280);
  doc.text('Page 1 of 1', 180, 280);
  
  // Save PDF to output path
  await new Promise((resolve, reject) => {
    try {
      doc.save(outputPath);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
  console.log(`Generated URAR report: ${outputPath}`);
  return outputPath;
}

/**
 * Generate Market Analysis report
 */
async function generateMarketAnalysisReport(job, tempDir) {
  // Create output directory
  const outputDir = join(baseOutputPath, 'market_analysis', job.userId.toString());
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate PDF file path
  const outputPath = join(outputDir, `${job.id}.pdf`);
  
  // Simulate PDF generation with jsPDF
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(16);
  doc.text('Market Analysis Report', 105, 20, { align: 'center' });
  
  // Add market information
  doc.setFontSize(12);
  doc.text(`Market Area: ${job.data.marketArea}`, 20, 40);
  doc.text(`Analysis Period: ${job.data.startDate} to ${job.data.endDate}`, 20, 50);
  doc.text(`Prepared By: ${job.data.analyst}`, 20, 60);
  
  // Add market metrics
  doc.text('Market Metrics', 105, 80, { align: 'center' });
  doc.text(`Average Sale Price: $${job.data.metrics.avgSalePrice.toLocaleString()}`, 20, 100);
  doc.text(`Median Sale Price: $${job.data.metrics.medianSalePrice.toLocaleString()}`, 20, 110);
  doc.text(`Price per Square Foot: $${job.data.metrics.pricePerSqFt.toFixed(2)}`, 20, 120);
  doc.text(`Average Days on Market: ${job.data.metrics.avgDaysOnMarket}`, 20, 130);
  doc.text(`Total Sales: ${job.data.metrics.totalSales}`, 20, 140);
  
  // Add price trends
  doc.text('Price Trends', 105, 160, { align: 'center' });
  doc.text(`Year-Over-Year Change: ${job.data.trends.yearOverYearChange}%`, 20, 180);
  doc.text(`Quarter-Over-Quarter Change: ${job.data.trends.quarterOverQuarterChange}%`, 20, 190);
  
  // Add footer
  doc.setFontSize(10);
  doc.text(`Report ID: ${job.id}`, 20, 280);
  doc.text('Page 1 of 1', 180, 280);
  
  // Save PDF to output path
  await new Promise((resolve, reject) => {
    try {
      doc.save(outputPath);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
  console.log(`Generated Market Analysis report: ${outputPath}`);
  return outputPath;
}

/**
 * Generate Property Card report
 */
async function generatePropertyCardReport(job, tempDir) {
  // Create output directory
  const outputDir = join(baseOutputPath, 'property_card', job.userId.toString());
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate PDF file path
  const outputPath = join(outputDir, `${job.id}.pdf`);
  
  // Simulate PDF generation
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(16);
  doc.text('Property Card', 105, 20, { align: 'center' });
  
  // Add property information
  doc.setFontSize(12);
  doc.text(`Property ID: ${job.data.parcelId}`, 20, 40);
  doc.text(`Address: ${job.data.address}`, 20, 50);
  doc.text(`City: ${job.data.city}`, 20, 60);
  doc.text(`State: ${job.data.state}`, 20, 70);
  doc.text(`Zip Code: ${job.data.zipCode}`, 20, 80);
  
  // Add property details
  doc.text('Property Details', 105, 100, { align: 'center' });
  doc.text(`Property Type: ${job.data.propertyType}`, 20, 120);
  doc.text(`Year Built: ${job.data.yearBuilt}`, 20, 130);
  doc.text(`Square Feet: ${job.data.squareFeet.toLocaleString()}`, 20, 140);
  doc.text(`Bedrooms: ${job.data.bedrooms}`, 20, 150);
  doc.text(`Bathrooms: ${job.data.bathrooms}`, 20, 160);
  
  // Add assessment information
  doc.text('Assessment Information', 105, 180, { align: 'center' });
  doc.text(`Land Value: $${job.data.landValue.toLocaleString()}`, 20, 200);
  doc.text(`Improvement Value: $${job.data.improvementValue.toLocaleString()}`, 20, 210);
  doc.text(`Total Value: $${job.data.totalValue.toLocaleString()}`, 20, 220);
  doc.text(`Assessment Year: ${job.data.assessmentYear}`, 20, 230);
  
  // Add footer
  doc.setFontSize(10);
  doc.text(`Report ID: ${job.id}`, 20, 280);
  doc.text('Page 1 of 1', 180, 280);
  
  // Save PDF to output path
  await new Promise((resolve, reject) => {
    try {
      doc.save(outputPath);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
  console.log(`Generated Property Card report: ${outputPath}`);
  return outputPath;
}

/**
 * Generate Comps Grid report
 */
async function generateCompsGridReport(job, tempDir) {
  // Create output directory
  const outputDir = join(baseOutputPath, 'comps_grid', job.userId.toString());
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate PDF file path
  const outputPath = join(outputDir, `${job.id}.pdf`);
  
  // Simulate PDF generation
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(16);
  doc.text('Comparable Properties Grid', 105, 20, { align: 'center' });
  
  // Add subject property information
  doc.setFontSize(12);
  doc.text('Subject Property:', 20, 40);
  doc.text(`Address: ${job.data.subject.address}`, 30, 50);
  doc.text(`Sale Price: $${job.data.subject.salePrice?.toLocaleString() || 'N/A'}`, 30, 60);
  doc.text(`Square Feet: ${job.data.subject.squareFeet.toLocaleString()}`, 30, 70);
  
  // Add comparable properties grid
  doc.text('Comparable Properties:', 20, 90);
  
  // Column headers
  doc.setFontSize(10);
  doc.text('Address', 20, 110);
  doc.text('Sale Price', 90, 110);
  doc.text('Price/SqFt', 130, 110);
  doc.text('Sale Date', 170, 110);
  
  // Draw horizontal line
  doc.line(20, 112, 190, 112);
  
  // Add rows
  let y = 120;
  job.data.comparables.forEach((comp, index) => {
    doc.text(comp.address, 20, y);
    doc.text(`$${comp.salePrice.toLocaleString()}`, 90, y);
    doc.text(`$${(comp.salePrice / comp.squareFeet).toFixed(2)}`, 130, y);
    doc.text(comp.saleDate, 170, y);
    y += 10;
  });
  
  // Add adjustments section
  y += 10;
  doc.setFontSize(12);
  doc.text('Adjustments Summary:', 20, y);
  y += 10;
  
  // Column headers for adjustments
  doc.setFontSize(10);
  doc.text('Comparable', 20, y);
  doc.text('Net Adjustment', 90, y);
  doc.text('Adjusted Price', 150, y);
  
  // Draw horizontal line
  y += 2;
  doc.line(20, y, 190, y);
  y += 10;
  
  // Add adjustment rows
  job.data.comparables.forEach((comp, index) => {
    doc.text(`Comp ${index + 1}`, 20, y);
    doc.text(`${comp.adjustments.net > 0 ? '+' : ''}${comp.adjustments.net.toLocaleString()}`, 90, y);
    doc.text(`$${comp.adjustments.adjustedPrice.toLocaleString()}`, 150, y);
    y += 10;
  });
  
  // Add conclusion
  y += 10;
  doc.setFontSize(12);
  doc.text('Market Value Conclusion:', 20, y);
  y += 10;
  doc.text(`Indicated Value: $${job.data.indicatedValue.toLocaleString()}`, 30, y);
  
  // Add footer
  doc.setFontSize(10);
  doc.text(`Report ID: ${job.id}`, 20, 280);
  doc.text('Page 1 of 1', 180, 280);
  
  // Save PDF to output path
  await new Promise((resolve, reject) => {
    try {
      doc.save(outputPath);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  
  console.log(`Generated Comps Grid report: ${outputPath}`);
  return outputPath;
}

/**
 * Generate Custom report
 */
async function generateCustomReport(job, tempDir) {
  // Create output directory
  const outputDir = join(baseOutputPath, 'custom', job.userId.toString());
  await fs.mkdir(outputDir, { recursive: true });
  
  // Generate file path based on format
  let outputPath;
  let fileExtension;
  
  switch (job.format) {
    case 'pdf':
      fileExtension = 'pdf';
      break;
    case 'docx':
      fileExtension = 'docx';
      break;
    case 'html':
      fileExtension = 'html';
      break;
    case 'json':
      fileExtension = 'json';
      break;
    case 'xml':
      fileExtension = 'xml';
      break;
    default:
      fileExtension = 'pdf';
  }
  
  outputPath = join(outputDir, `${job.id}.${fileExtension}`);
  
  // Generate the appropriate format
  if (fileExtension === 'pdf') {
    // Generate PDF
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(16);
    doc.text(job.data.title || 'Custom Report', 105, 20, { align: 'center' });
    
    // Add custom content
    doc.setFontSize(12);
    let y = 40;
    
    if (job.data.sections) {
      job.data.sections.forEach(section => {
        doc.setFontSize(14);
        doc.text(section.title, 20, y);
        y += 10;
        
        doc.setFontSize(12);
        
        // Split text into lines to avoid overflow
        const lines = doc.splitTextToSize(section.content, 170);
        doc.text(lines, 20, y);
        y += lines.length * 7 + 10;
        
        // Ensure we don't go off the page
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }
    
    // Add footer
    doc.setFontSize(10);
    doc.text(`Report ID: ${job.id}`, 20, 280);
    doc.text(`Generated: ${new Date().toISOString()}`, 100, 280);
    
    // Save PDF to output path
    await new Promise((resolve, reject) => {
      try {
        doc.save(outputPath);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  } else if (fileExtension === 'json') {
    // Generate JSON
    await fs.writeFile(outputPath, JSON.stringify(job.data, null, 2));
  } else if (fileExtension === 'html') {
    // Generate simple HTML
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${job.data.title || 'Custom Report'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #555; }
  </style>
</head>
<body>
  <h1>${job.data.title || 'Custom Report'}</h1>`;
    
    if (job.data.sections) {
      job.data.sections.forEach(section => {
        html += `
  <div class="section">
    <h2>${section.title}</h2>
    <div>${section.content}</div>
  </div>`;
      });
    }
    
    html += `
  <footer>
    <p>Report ID: ${job.id}</p>
    <p>Generated: ${new Date().toISOString()}</p>
  </footer>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  } else {
    throw new Error(`Format ${job.format} not implemented yet`);
  }
  
  console.log(`Generated Custom report (${fileExtension}): ${outputPath}`);
  return outputPath;
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Worker ${workerId} Unhandled Rejection:`, reason);
});

process.on('uncaughtException', (error) => {
  console.error(`Worker ${workerId} Uncaught Exception:`, error);
  process.exit(1);
});
