const jsPDF = require('jspdf');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class ExportService {
  constructor() {
    this.pdf = null;
    this.workbook = null;
  }

  // PDF Export Methods
  generateInvoicePDF(invoices, user) {
    this.pdf = new jsPDF();
    
    // Header
    this.pdf.setFontSize(20);
    this.pdf.text('Invoice Report', 20, 20);
    this.pdf.setFontSize(12);
    this.pdf.text(`Generated by: ${user.name}`, 20, 30);
    this.pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
    
    // Table headers
    const headers = ['Invoice #', 'Amount', 'Commission', 'Status', 'Date', 'Description'];
    const startY = 60;
    let currentY = startY;
    
    this.pdf.setFontSize(10);
    this.pdf.setFillColor(240, 240, 240);
    
    // Draw header row
    headers.forEach((header, index) => {
      const x = 20 + (index * 30);
      this.pdf.rect(x, currentY - 5, 30, 8, 'F');
      this.pdf.text(header, x + 2, currentY);
    });
    
    currentY += 10;
    
    // Draw data rows
    invoices.forEach((invoice, rowIndex) => {
      if (currentY > 250) {
        this.pdf.addPage();
        currentY = 20;
      }
      
      const rowData = [
        invoice.invoice_number,
        `$${invoice.amount?.toLocaleString() || 0}`,
        `$${invoice.commission_amount?.toLocaleString() || 0}`,
        invoice.status,
        new Date(invoice.created_at).toLocaleDateString(),
        invoice.description?.substring(0, 20) + (invoice.description?.length > 20 ? '...' : '')
      ];
      
      rowData.forEach((cell, index) => {
        const x = 20 + (index * 30);
        this.pdf.text(cell, x + 2, currentY);
      });
      
      currentY += 8;
    });
    
    // Footer
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalCommission = invoices.reduce((sum, inv) => sum + (inv.commission_amount || 0), 0);
    
    this.pdf.setFontSize(12);
    this.pdf.text(`Total Amount: $${totalAmount.toLocaleString()}`, 20, currentY + 10);
    this.pdf.text(`Total Commission: $${totalCommission.toLocaleString()}`, 20, currentY + 20);
    
    return this.pdf;
  }

  generateBudgetPDF(budgetData, scope) {
    this.pdf = new jsPDF();
    
    // Header
    this.pdf.setFontSize(20);
    this.pdf.text(`${scope.charAt(0).toUpperCase() + scope.slice(1)} Budget Report`, 20, 20);
    this.pdf.setFontSize(12);
    this.pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Budget Summary
    this.pdf.setFontSize(14);
    this.pdf.text('Budget Summary', 20, 50);
    this.pdf.setFontSize(12);
    
    // Safely format numbers
    const budget = Number(budgetData.budget) || 0;
    const spent = Number(budgetData.spent) || 0;
    const remaining = Number(budgetData.remaining) || 0;
    
    this.pdf.text(`Total Budget: $${budget.toLocaleString()}`, 20, 65);
    this.pdf.text(`Total Spent: $${spent.toLocaleString()}`, 20, 75);
    this.pdf.text(`Remaining: $${remaining.toLocaleString()}`, 20, 85);
    
    // Utilization percentage
    const utilization = budget > 0 ? (spent / budget) * 100 : 0;
    this.pdf.text(`Utilization: ${utilization.toFixed(1)}%`, 20, 95);
    
    // Department breakdown (if available)
    if (budgetData.departments && budgetData.departments.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.text('Department Breakdown', 20, 120);
      
      let currentY = 135;
      budgetData.departments.forEach((dept, index) => {
        if (currentY > 250) {
          this.pdf.addPage();
          currentY = 20;
        }
        
        this.pdf.setFontSize(10);
        const deptSpent = Number(dept.spent) || 0;
        const deptBudget = Number(dept.budget) || 0;
        this.pdf.text(`${dept.name}: $${deptSpent.toLocaleString()} / $${deptBudget.toLocaleString()}`, 20, currentY);
        currentY += 8;
      });
    }
    
    return this.pdf;
  }

  generateCommissionPDF(commissionData, scope) {
    this.pdf = new jsPDF();
    
    // Header
    this.pdf.setFontSize(20);
    this.pdf.text(`${scope.charAt(0).toUpperCase() + scope.slice(1)} Commission Report`, 20, 20);
    this.pdf.setFontSize(12);
    this.pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Summary
    this.pdf.setFontSize(14);
    this.pdf.text('Commission Summary', 20, 50);
    this.pdf.setFontSize(12);
    this.pdf.text(`Total Revenue: $${commissionData.totalRevenue?.toLocaleString() || 0}`, 20, 65);
    this.pdf.text(`Total Commission: $${commissionData.totalCommission?.toLocaleString() || 0}`, 20, 75);
    this.pdf.text(`Average Rate: ${commissionData.avgCommissionRate?.toFixed(1) || 0}%`, 20, 85);
    
    // Monthly data
    if (commissionData.monthlyData && commissionData.monthlyData.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.text('Monthly Breakdown', 20, 110);
      
      const headers = ['Month', 'Revenue', 'Commission'];
      let currentY = 125;
      
      // Header row
      this.pdf.setFillColor(240, 240, 240);
      headers.forEach((header, index) => {
        const x = 20 + (index * 50);
        this.pdf.rect(x, currentY - 5, 50, 8, 'F');
        this.pdf.text(header, x + 2, currentY);
      });
      
      currentY += 10;
      
      // Data rows
      commissionData.monthlyData.forEach((month, index) => {
        if (currentY > 250) {
          this.pdf.addPage();
          currentY = 20;
        }
        
        const rowData = [
          month.month,
          `$${month.revenue?.toLocaleString() || 0}`,
          `$${month.commission?.toLocaleString() || 0}`
        ];
        
        rowData.forEach((cell, cellIndex) => {
          const x = 20 + (cellIndex * 50);
          this.pdf.text(cell, x + 2, currentY);
        });
        
        currentY += 8;
      });
    }
    
    // Top performers (if available)
    if (commissionData.topPerformers && commissionData.topPerformers.length > 0) {
      this.pdf.setFontSize(14);
      this.pdf.text('Top Performers', 20, currentY + 10);
      
      commissionData.topPerformers.forEach((performer, index) => {
        this.pdf.setFontSize(10);
        this.pdf.text(`${index + 1}. ${performer.name}: $${performer.commission?.toLocaleString() || 0}`, 20, currentY + 20 + (index * 8));
      });
    }
    
    return this.pdf;
  }

  // Excel Export Methods
  generateInvoiceExcel(invoices, user) {
    this.workbook = XLSX.utils.book_new();
    
    // Prepare data
    const data = invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Amount': invoice.amount || 0,
      'Commission Amount': invoice.commission_amount || 0,
      'Commission Rate': invoice.commission_rate || 0,
      'Status': invoice.status,
      'Created Date': new Date(invoice.created_at).toLocaleDateString(),
      'Description': invoice.description || '',
      'User': invoice.user_name || '',
      'Department': invoice.department || ''
    }));
    
    // Add summary data
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalCommission = invoices.reduce((sum, inv) => sum + (inv.commission_amount || 0), 0);
    
    data.push({});
    data.push({
      'Invoice Number': 'TOTALS',
      'Amount': totalAmount,
      'Commission Amount': totalCommission,
      'Commission Rate': totalAmount > 0 ? (totalCommission / totalAmount) * 100 : 0
    });
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // Invoice Number
      { width: 12 }, // Amount
      { width: 15 }, // Commission Amount
      { width: 15 }, // Commission Rate
      { width: 12 }, // Status
      { width: 12 }, // Created Date
      { width: 30 }, // Description
      { width: 15 }, // User
      { width: 15 }  // Department
    ];
    
    XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Invoices');
    
    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Invoices', 'Value': invoices.length },
      { 'Metric': 'Total Amount', 'Value': totalAmount },
      { 'Metric': 'Total Commission', 'Value': totalCommission },
      { 'Metric': 'Average Commission Rate', 'Value': totalAmount > 0 ? (totalCommission / totalAmount) * 100 : 0 },
      { 'Metric': 'Pending Invoices', 'Value': invoices.filter(inv => inv.status === 'pending').length },
      { 'Metric': 'Approved Invoices', 'Value': invoices.filter(inv => inv.status === 'approved').length },
      { 'Metric': 'Rejected Invoices', 'Value': invoices.filter(inv => inv.status === 'rejected').length }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(this.workbook, summarySheet, 'Summary');
    
    return this.workbook;
  }

  generateBudgetExcel(budgetData, scope) {
    this.workbook = XLSX.utils.book_new();
    
    // Main budget data
    const mainData = [
      { 'Metric': 'Total Budget', 'Value': budgetData.budget || 0 },
      { 'Metric': 'Total Spent', 'Value': budgetData.spent || 0 },
      { 'Metric': 'Remaining', 'Value': budgetData.remaining || 0 },
      { 'Metric': 'Utilization %', 'Value': budgetData.budget > 0 ? (budgetData.spent / budgetData.budget) * 100 : 0 }
    ];
    
    const mainSheet = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(this.workbook, mainSheet, 'Budget Summary');
    
    // Department breakdown (if available)
    if (budgetData.departments && budgetData.departments.length > 0) {
      const deptData = budgetData.departments.map(dept => ({
        'Department': dept.name,
        'Budget': dept.budget || 0,
        'Spent': dept.spent || 0,
        'Remaining': (dept.budget || 0) - (dept.spent || 0),
        'Utilization %': dept.budget > 0 ? (dept.spent / dept.budget) * 100 : 0
      }));
      
      const deptSheet = XLSX.utils.json_to_sheet(deptData);
      XLSX.utils.book_append_sheet(this.workbook, deptSheet, 'Department Breakdown');
    }
    
    return this.workbook;
  }

  generateCommissionExcel(commissionData, scope) {
    this.workbook = XLSX.utils.book_new();
    
    // Summary data
    const summaryData = [
      { 'Metric': 'Total Revenue', 'Value': commissionData.totalRevenue || 0 },
      { 'Metric': 'Total Commission', 'Value': commissionData.totalCommission || 0 },
      { 'Metric': 'Average Commission Rate', 'Value': commissionData.avgCommissionRate || 0 }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(this.workbook, summarySheet, 'Summary');
    
    // Monthly data
    if (commissionData.monthlyData && commissionData.monthlyData.length > 0) {
      const monthlyData = commissionData.monthlyData.map(month => ({
        'Month': month.month,
        'Revenue': month.revenue || 0,
        'Commission': month.commission || 0,
        'Commission Rate %': month.revenue > 0 ? (month.commission / month.revenue) * 100 : 0
      }));
      
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(this.workbook, monthlySheet, 'Monthly Data');
    }
    
    // Top performers
    if (commissionData.topPerformers && commissionData.topPerformers.length > 0) {
      const performerData = commissionData.topPerformers.map((performer, index) => ({
        'Rank': index + 1,
        'Name': performer.name,
        'Commission': performer.commission || 0
      }));
      
      const performerSheet = XLSX.utils.json_to_sheet(performerData);
      XLSX.utils.book_append_sheet(this.workbook, performerSheet, 'Top Performers');
    }
    
    return this.workbook;
  }

  // Utility methods
  savePDF(pdf, filename) {
    try {
      const filePath = path.join(__dirname, '..', 'exports', filename);
      const dir = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Use the correct Node.js method for jsPDF
      const pdfBuffer = pdf.output('arraybuffer');
      fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
      return filePath;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF file: ' + error.message);
    }
  }

  saveExcel(workbook, filename) {
    try {
      const filePath = path.join(__dirname, '..', 'exports', filename);
      const dir = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save the Excel file
      XLSX.writeFile(workbook, filePath);
      return filePath;
    } catch (error) {
      console.error('Error saving Excel:', error);
      throw new Error('Failed to save Excel file');
    }
  }

  generateBudgetCSV(budgetData, scope) {
    let csvContent = '';
    
    // Add header
    csvContent += 'Metric,Value\n';
    
    // Main budget data
    csvContent += `Total Budget,${budgetData.budget || 0}\n`;
    csvContent += `Total Spent,${budgetData.spent || 0}\n`;
    csvContent += `Remaining,${budgetData.remaining || 0}\n`;
    csvContent += `Utilization %,${budgetData.budget > 0 ? (budgetData.spent / budgetData.budget) * 100 : 0}\n`;
    
    // Department breakdown (if available)
    if (budgetData.departments && budgetData.departments.length > 0) {
      csvContent += '\nDepartment Breakdown\n';
      csvContent += 'Department,Budget,Spent,Remaining,Utilization %\n';
      
      budgetData.departments.forEach(dept => {
        const remaining = (dept.budget || 0) - (dept.spent || 0);
        const utilization = dept.budget > 0 ? (dept.spent / dept.budget) * 100 : 0;
        csvContent += `${dept.name},${dept.budget || 0},${dept.spent || 0},${remaining},${utilization}\n`;
      });
    }
    
    return csvContent;
  }

  // Utility methods
  saveCSV(csvContent, filename) {
    try {
      const filePath = path.join(__dirname, '..', 'exports', filename);
      const dir = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save the CSV file
      fs.writeFileSync(filePath, csvContent, 'utf8');
      return filePath;
    } catch (error) {
      console.error('Error saving CSV:', error);
      throw new Error('Failed to save CSV file');
    }
  }

  generateInvoiceCSV(invoices, user) {
    let csvContent = '';
    
    // Add header
    csvContent += 'Invoice Number,Amount,Commission Amount,Commission Rate,Status,Created Date,Description,User,Department\n';
    
    // Add invoice data
    invoices.forEach(invoice => {
      const commissionRate = invoice.amount > 0 ? (invoice.commission_amount / invoice.amount) * 100 : 0;
      csvContent += `"${invoice.invoice_number || ''}","${invoice.amount || 0}","${invoice.commission_amount || 0}","${commissionRate.toFixed(2)}%","${invoice.status || ''}","${new Date(invoice.created_at).toLocaleDateString()}","${invoice.description || ''}","${invoice.user_name || ''}","${invoice.department || ''}"\n`;
    });
    
    // Add summary
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalCommission = invoices.reduce((sum, inv) => sum + (inv.commission_amount || 0), 0);
    const avgCommissionRate = totalAmount > 0 ? (totalCommission / totalAmount) * 100 : 0;
    
    csvContent += '\nSummary\n';
    csvContent += 'Total Invoices,Total Amount,Total Commission,Average Commission Rate,Pending,Approved,Rejected\n';
    csvContent += `${invoices.length},${totalAmount},${totalCommission},${avgCommissionRate.toFixed(2)}%,${invoices.filter(inv => inv.status === 'pending').length},${invoices.filter(inv => inv.status === 'approved').length},${invoices.filter(inv => inv.status === 'rejected').length}\n`;
    
    return csvContent;
  }

  generateCommissionCSV(commissionData, scope) {
    let csvContent = '';
    
    // Add header
    csvContent += 'Metric,Value\n';
    
    // Summary data
    csvContent += `Total Revenue,${commissionData.totalRevenue || 0}\n`;
    csvContent += `Total Commission,${commissionData.totalCommission || 0}\n`;
    csvContent += `Average Commission Rate,${commissionData.avgCommissionRate || 0}%\n`;
    
    // Monthly data (if available)
    if (commissionData.monthlyData && commissionData.monthlyData.length > 0) {
      csvContent += '\nMonthly Data\n';
      csvContent += 'Month,Revenue,Commission,Commission Rate %\n';
      
      commissionData.monthlyData.forEach(month => {
        const commissionRate = month.revenue > 0 ? (month.commission / month.revenue) * 100 : 0;
        csvContent += `"${month.month}","${month.revenue || 0}","${month.commission || 0}","${commissionRate.toFixed(2)}"\n`;
      });
    }
    
    // Top performers (if available)
    if (commissionData.topPerformers && commissionData.topPerformers.length > 0) {
      csvContent += '\nTop Performers\n';
      csvContent += 'Rank,Name,Commission\n';
      
      commissionData.topPerformers.forEach((performer, index) => {
        csvContent += `${index + 1},"${performer.name}","${performer.commission || 0}"\n`;
      });
    }
    
    return csvContent;
  }
}

module.exports = ExportService; 