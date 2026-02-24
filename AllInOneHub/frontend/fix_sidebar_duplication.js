const fs = require('fs');
const path = require('path');

// Files that should NOT have Sidebar imports (they should use Layout)
const pagesToFix = [
  'src/pages/Analytics.jsx',
  'src/pages/AssetProfile.jsx',
  'src/pages/Assets.jsx',
  'src/pages/Attendance.jsx',
  'src/pages/AttendanceUpload.jsx',
  'src/pages/Breakdowns.jsx',
  'src/pages/CallCenterDemo.jsx',
  'src/pages/Complaints.jsx',
  'src/pages/CSPA.jsx',
  'src/pages/DriverForm.jsx',
  'src/pages/DriverOperations.jsx',
  'src/pages/DriverProfile.jsx',
  'src/pages/EmployeeForm.jsx',
  'src/pages/EmployeeProfile.jsx',
  'src/pages/EPR.jsx',
  'src/pages/ExpenseTracker.jsx',
  'src/pages/FleetManagement.jsx',
  'src/pages/ITAssets.jsx',
  'src/pages/ITTickets.jsx',
  'src/pages/PaymentCalendar.jsx',
  'src/pages/Payroll.jsx',
  'src/pages/Suggestions.jsx',
  'src/pages/Surveys.jsx',
  'src/pages/TaskManagement.jsx',
  'src/pages/Tasks.jsx',
  'src/pages/Tickets.jsx',
  'src/pages/UpcomingPaymentEvents.jsx',
  'src/pages/UserProfile.jsx',
  'src/pages/Voucher.jsx',
  'src/pages/AccessRequests.jsx'
];

function fixPage(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove Sidebar import
    if (content.includes("import Sidebar from")) {
      content = content.replace(/import Sidebar from ["']\.\.\/components\/Sidebar["'];?\n?/g, '');
      modified = true;
    }

    // Remove useSidebar import
    if (content.includes("import { useSidebar }")) {
      content = content.replace(/import \{ useSidebar \} from ["']\.\.\/context\/SidebarContext["'];?\n?/g, '');
      modified = true;
    }

    // Remove Sidebar component usage
    if (content.includes('<Sidebar />')) {
      content = content.replace(/<Sidebar \/>\n?/g, '');
      modified = true;
    }

    // Remove sidebarWidth usage
    if (content.includes('sidebarWidth')) {
      content = content.replace(/const \{ sidebarWidth \} = useSidebar\(\);\n?/g, '');
      content = content.replace(/style=\{\{ marginLeft: `\$\{sidebarWidth\}px` \}\}/g, '');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing sidebar duplication in pages...\n');

pagesToFix.forEach(fixPage);

console.log('\n🎉 Sidebar duplication fix completed!');
console.log('\n📋 Next steps:');
console.log('1. Refresh your browser');
console.log('2. Check if duplicate sidebars are gone');
console.log('3. Verify all pages still work correctly');
console.log('4. Test navigation between different pages');
