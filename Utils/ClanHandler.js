const FirestoreManager = require("../Firestore/FirestoreManager");
const firestoreManager = FirestoreManager.getInstance();


let clansList = [];

class ClanHandler {

    static intervalID = null;

    static startReloadInterval() {

        // If there's an existing interval, clear it first
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }

        // Set an interval to reload every hour (3600000 milliseconds)
        this.intervalID = setInterval(() => {
            this.reloadClansFromDb();
        }, 1000 * 3600 * 1);
    }

    static stopReloadInterval() {
        if (this.intervalID) {
            clearInterval(this.intervalID);
            this.intervalID = null;
        }
    }

    static async loadClansFromDb() {

        const collName = "Clans";
        const parentPath = "/";

        // Load all clan Ids
        const clanIds = await firestoreManager.readCollectionDocumentIds(collName, parentPath);
        //console.log("clanIds loaded :" + clanIds.length);

        // Define the projection for the bulk read
        const projection = {
            "clanId": 1,
            "clanName": 1,
            "clanLevel": 1,
            "clanTrophy": 1,
            "clanLogo" : 1,
            "clanType": 1,
            "requiredTrophy": 1,
            "members": 1
        };

        // Split the clanIds into chunks of 1000
        const chunkSize = 1000;
        let chunks = [];
        for (let i = 0; i < clanIds.length; i += chunkSize) {
            chunks.push(clanIds.slice(i, i + chunkSize));
        }

        // Fetch each chunk sequentially and transform the results
        for (let chunk of chunks) {
            const clanDetails = await firestoreManager.bulkReadDocuments(collName, parentPath, chunk, projection);

            const transformedDetails = clanDetails.map(clan => ({
                clanId: clan.clanId,
                clanName: clan.clanName,
                clanLevel: clan.clanLevel,
                clanTrophy: clan.clanTrophy,
                clanLogo: clan.clanLogo,
                clanType: clan.clanType,
                requiredTrophy: clan.requiredTrophy,
                members: clan.members.length
            }))
                .filter(clan => clan.members > 0);  // Exclude clans with zero members


            clansList.push(...transformedDetails);
        }

        //console.log("clansList loaded :" + clansList.length);

        this.startReloadInterval()
    }


    static async reloadClansFromDb() {
        const collName = "Clans";
        const parentPath = "/";

        // Load all clan Ids
        const clanIds = await firestoreManager.readCollectionDocumentIds(collName, parentPath);
        //console.log("clanIds loaded :" + clanIds.length);

        // Define the projection for the bulk read
        const projection = {
            "clanId": 1,
            "clanName": 1,
            "clanLevel": 1,
            "clanTrophy": 1,
            "clanLogo" : 1,
            "clanType": 1,
            "requiredTrophy": 1,
            "members": 1
        };

        // Split the clanIds into chunks of 1000
        const chunkSize = 1000;
        let chunks = [];
        for (let i = 0; i < clanIds.length; i += chunkSize) {
            chunks.push(clanIds.slice(i, i + chunkSize));
        }

        // Use a local variable to store clans during loading
        let reloadingClanList = [];

        // Fetch each chunk sequentially, transform the results, and then sleep for 10 seconds
        for (let chunk of chunks) {
            const clanDetails = await firestoreManager.bulkReadDocuments(collName, parentPath, chunk, projection);

            const transformedDetails = clanDetails.map(clan => ({
                clanId: clan.clanId,
                clanName: clan.clanName,
                clanLevel: clan.clanLevel,
                clanTrophy: clan.clanTrophy,
                clanLogo: clan.clanLogo,
                clanType: clan.clanType,
                requiredTrophy: clan.requiredTrophy,
                members: clan.members.length
            }))
                .filter(clan => clan.members > 0);  // Exclude clans with zero members

            reloadingClanList.push(...transformedDetails);

            // Sleep for 0.1 seconds
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Clear the old clansList and fill it with the reloaded clans
        clansList.length = 0;  // This clears the array
        clansList.push(...reloadingClanList);

        //console.log("clansList reloaded with count:" + clansList.length);
    }


    static addClan(clan) {
        clansList.push(clan);
    }



    static deleteClan(clanId) {
        const index = clansList.findIndex(clan => clan.clanId === clanId);
        if (index !== -1) {
            clansList.splice(index, 1);
            return true;
        }
        return false;
    }



    static search({ searchName, type, minClanLevel, minClanTrophy, minMember, maxResult }) {

        minClanLevel = parseInt(minClanLevel);
        minClanTrophy = parseInt(minClanTrophy);
        minMember = parseInt(minMember);
        maxResult = parseInt(maxResult);

        let matchingClans = [];

        if (!searchName) {
            const numberOfClansToSelect = maxResult < clansList.length ? maxResult : clansList.length - 1;
            const uniqueRandomIndices = new Set();
    
            const maxAttempts = 100000;
            let attempts = 0;
            while (uniqueRandomIndices.size < numberOfClansToSelect && attempts < maxAttempts) {
                const randomIndex = Math.floor(Math.random() * clansList.length);
    
                const selectedClan = clansList[randomIndex];
    
                // Apply filters
                if (type && selectedClan.clanType !== type) {
                    attempts++; // Increment the attempts counter
                    continue;
                }
    
                if (selectedClan.clanLevel < minClanLevel) {
                    attempts++; // Increment the attempts counter
                    continue;
                }
                
                if (selectedClan.clanTrophy < minClanTrophy) {
                    attempts++; // Increment the attempts counter
                    continue;
                }
                
                if (selectedClan.members < minMember) {
                    attempts++; // Increment the attempts counter
                    continue;
                }
                
                uniqueRandomIndices.add(randomIndex);
                attempts++; // Increment the attempts counter
            }
    
            for (let index of uniqueRandomIndices) {
                matchingClans.push(clansList[index]);
            }

        } else {
            const regex = new RegExp(searchName, 'i');
            for (let clan of clansList) {

                // Apply other filters
                if (clan.clanLevel < minClanLevel) {
                    continue;
                }
                if (clan.clanTrophy < minClanTrophy) {
                    continue;
                }
                if (clan.members < minMember) {
                    continue;
                }

                if (type && clan.clanType !== type) {
                    continue;
                }


                // Filter by clan name
                if (!regex.test(clan.clanName)) {
                    continue;
                }

                
                //add document
                matchingClans.push(clan);


                // Limit results
                if (matchingClans.length === maxResult) {
                    break;
                }
            }
        }

        return matchingClans;
    }

}

module.exports = ClanHandler;
