const http = require('http');
const url = require('url');
const ClanHandler = require('./Utils/ClanHandler');
const Validator = require('./Utils/Validator');

const initServer = async () => {

    // Load clans from DB before starting the server
    await ClanHandler.loadClansFromDb();


    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);


        if (parsedUrl.pathname === '/search' && req.method === 'GET') {

            let {
                searchName,
                type,
                minClanLevel,
                minClanTrophy,
                minMember,
                maxResult,
            } = parsedUrl.query;

            // Check if all query parameters are provided
            if (!minClanLevel || !minClanTrophy || !minMember || !maxResult) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('All query parameters are required');
                return;
            }

            // Check if maxResult is <= 100
            if (maxResult > 500000) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('maxResult should be less than or equal to 100');
                return;
            }

            const matchingClans = ClanHandler.search({
                searchName,
                type,
                minClanLevel,
                minClanTrophy,
                minMember,
                maxResult
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(matchingClans));


        } else if (parsedUrl.pathname === '/addClan' && req.method === 'POST') {

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });
            req.on('end', () => {

                let clanDetails = JSON.parse(body);

                // Validate clan details
                const validationError = Validator.validateClan(clanDetails);
                if (validationError) {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end(validationError);
                    return;
                }


                // Add clan to clansList
                ClanHandler.addClan(clanDetails);

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Clan added successfully');
            });



        }else if (parsedUrl.pathname === '/deleteClan' && req.method === 'DELETE') {

            let body = '';
            req.on('data', chunk => {
                body += chunk.toString(); // convert Buffer to string
            });
            req.on('end', () => {
                let requestData = JSON.parse(body);
                
                // Validate clanId presence
                if (!requestData.clanId || typeof requestData.clanId !== 'string') {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid or missing clanId.');
                    return;
                }
    
                // Delete clan using clanId
                const deleted = ClanHandler.deleteClan(requestData.clanId);
    
                if (deleted) {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Clan deleted successfully');
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Clan not found.');
                }

            });


        }else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }


    });

    const PORT = 15998+100;
    server.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
};

// Initialize the server
initServer();