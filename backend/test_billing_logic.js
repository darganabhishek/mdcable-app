
// Mock Billing Logic Verification
function calculateBilling(pkgPrice, discount, installationDate, paymentAmount, currentNextBillingDate = null, currentBalance = 0) {
    const monthlyRate = Math.max(0, pkgPrice - discount);
    const totalAvailable = paymentAmount + currentBalance;
    
    let nextBilling = currentNextBillingDate ? new Date(currentNextBillingDate) : new Date(installationDate);
    let balance = totalAvailable;

    if (monthlyRate > 0) {
        const monthsCovered = Math.floor(totalAvailable / monthlyRate);
        const remainingBalance = totalAvailable % monthlyRate;
        
        if (monthsCovered > 0) {
            nextBilling.setMonth(nextBilling.getMonth() + monthsCovered);
        }
        balance = remainingBalance;
    }

    return {
        nextBilling: nextBilling.toISOString().split('T')[0],
        balance: balance.toFixed(2)
    };
}

// Scenarios
console.log("--- Scenario 1: Exact Payment ---");
console.log(calculateBilling(700, 0, "2026-03-12", 700)); 
// Expected: monthsCovered=1, nextBilling="2026-04-12", balance=0.00

console.log("\n--- Scenario 2: Advance Payment (4000 for 700 pkg) ---");
console.log(calculateBilling(700, 0, "2026-03-12", 4000));
// Expected: monthsCovered=5, nextBilling="2026-08-12", balance=500.00

console.log("\n--- Scenario 3: Renewal with Previous Balance ---");
// Current balance 500, pay 400 more, package 700. Total 900.
console.log(calculateBilling(700, 0, "2026-03-12", 400, "2026-08-12", 500));
// Expected: total=900, monthsCovered=1, nextBilling="2026-09-12", balance=200.00

console.log("\n--- Scenario 4: Partial Payment (below package price) ---");
console.log(calculateBilling(700, 0, "2026-03-12", 300));
// Expected: monthsCovered=0, nextBilling="2026-03-12", balance=300.00
