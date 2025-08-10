document.addEventListener('DOMContentLoaded', function() {
    // [Previous code remains the same until the issueItems function]

    // Corrected issueItems function
    function issueItems(jobId, personName, items, task, date) {
        const dateObj = date ? new Date(date) : new Date();
        
        // Batch write to Firestore
        const batch = firestoreDB.batch();
        
        // Add active job document
        const jobRef = firestoreDB.collection('activeJobs').doc(jobId);
        batch.set(jobRef, {
            jobId: jobId,
            personName: personName,
            items: items,
            task: task,
            date: dateObj
        });
        
        // Create a SINGLE transaction record for all items
        const transactionRef = firestoreDB.collection('transactions').doc();
        batch.set(transactionRef, {
            jobId: jobId,
            personName: personName,
            items: items,  // Store all items as an array in one transaction
            action: 'issue',
            task: task,
            date: dateObj
        });
        
        return batch.commit();
    }

    // Corrected generateMonthlyReport function
    function generateMonthlyReport(month) {
        // Parse month (format: YYYY-MM)
        const [year, monthNum] = month.split('-');
        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
        
        firestoreDB.collection('transactions')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get()
            .then(snapshot => {
                const summary = {
                    totalIssued: 0,
                    totalReturned: 0,
                    netChange: 0
                };
                
                const transactions = [];
                
                snapshot.forEach(doc => {
                    const t = doc.data();
                    transactions.push({
                        ...t,
                        date: t.date.toDate()
                    });
                    
                    // Calculate totals based on items array
                    if (t.items && Array.isArray(t.items)) {
                        t.items.forEach(item => {
                            if (t.action === 'issue') {
                                summary.totalIssued += item.quantity;
                                summary.netChange -= item.quantity;
                            } else {
                                summary.totalReturned += item.quantity;
                                summary.netChange += item.quantity;
                            }
                        });
                    }
                });
                
                // Update summary
                const summaryStats = document.getElementById('summary-stats');
                summaryStats.innerHTML = '';
                
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'report-summary-stats';
                
                const issuedStat = document.createElement('p');
                issuedStat.innerHTML = `<strong>Total Items Issued:</strong> ${summary.totalIssued}`;
                summaryDiv.appendChild(issuedStat);
                
                const returnedStat = document.createElement('p');
                returnedStat.innerHTML = `<strong>Total Items Returned:</strong> ${summary.totalReturned}`;
                summaryDiv.appendChild(returnedStat);
                
                const netStat = document.createElement('p');
                netStat.innerHTML = `<strong>Net Change:</strong> ${summary.netChange > 0 ? '+' : ''}${summary.netChange}`;
                summaryDiv.appendChild(netStat);
                
                summaryStats.appendChild(summaryDiv);
                
                // Update detailed transactions
                const reportTable = document.querySelector('#report-table tbody');
                reportTable.innerHTML = '';
                
                transactions.forEach(transaction => {
                    if (transaction.items && Array.isArray(transaction.items)) {
                        transaction.items.forEach(item => {
                            const row = document.createElement('tr');
                            
                            const dateCell = document.createElement('td');
                            dateCell.textContent = transaction.date.toLocaleDateString();
                            row.appendChild(dateCell);
                            
                            const jobCell = document.createElement('td');
                            jobCell.textContent = transaction.jobId;
                            row.appendChild(jobCell);
                            
                            const personCell = document.createElement('td');
                            personCell.textContent = transaction.personName;
                            row.appendChild(personCell);
                            
                            const itemCell = document.createElement('td');
                            itemCell.textContent = item.itemName;
                            row.appendChild(itemCell);
                            
                            const qtyCell = document.createElement('td');
                            qtyCell.textContent = item.quantity;
                            row.appendChild(qtyCell);
                            
                            const actionCell = document.createElement('td');
                            actionCell.textContent = transaction.action === 'issue' ? 'Issued' : 'Returned';
                            actionCell.className = transaction.action === 'issue' ? 'text-success' : 'text-info';
                            row.appendChild(actionCell);
                            
                            reportTable.appendChild(row);
                        });
                    }
                });
            });
    }

    // Corrected returnItemsToInventory function
    function returnItemsToInventory(jobId, returnItems) {
        return firestoreDB.runTransaction(async (transaction) => {
            // Get the job document
            const jobRef = firestoreDB.collection('activeJobs').doc(jobId);
            const jobDoc = await transaction.get(jobRef);
            
            if (!jobDoc.exists) {
                throw new Error('Job not found');
            }
            
            const job = jobDoc.data();
            
            // Create a SINGLE return transaction for all items
            const transactionRef = firestoreDB.collection('transactions').doc();
            transaction.set(transactionRef, {
                jobId: jobId,
                personName: job.personName,
                items: returnItems.map(item => ({
                    itemName: item.itemName,
                    quantity: item.returnedQty,
                    unit: item.unit
                })),
                action: 'return',
                task: job.task,
                date: new Date()
            });
            
            // Check if all items are returned
            const allReturned = returnItems.every(returnItem => 
                returnItem.returnedQty === returnItem.originalQty
            );
            
            if (allReturned) {
                // Delete the active job if all items are returned
                transaction.delete(jobRef);
            }
            
            return Promise.resolve();
        });
    }

    // [Rest of the code remains the same]
});