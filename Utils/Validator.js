


const validateClan = (clanDetails) => {

    // Validate presence
    const requiredFields = ["clanId", "clanName", "clanLevel", "clanTrophy", "clanType", "requiredTrophy", "members"];
    for (let field of requiredFields) {
        if (clanDetails[field] === undefined) {
            return `Field ${field} is missing or invalid.`;
        }
    }

    // Validate data types
    if (typeof clanDetails.clanId !== 'string' || clanDetails.clanId.trim() === "") {
        return 'Invalid clanId.';
    }

    if (typeof clanDetails.clanName !== 'string' || clanDetails.clanName.trim() === "") {
        return 'Invalid clanName.';
    }

    if (typeof clanDetails.clanLogo !== 'number' || clanDetails.clanLevel < 1) {
        return 'Invalid clanLogo.';
    }

    if (typeof clanDetails.clanLevel !== 'number' || clanDetails.clanLevel < 0) {
        return 'Invalid clanLevel.';
    }

    if (typeof clanDetails.clanTrophy !== 'number' || clanDetails.clanTrophy < 0) {
        return 'Invalid clanTrophy.';
    }

    if (typeof clanDetails.requiredTrophy !== 'number' || clanDetails.requiredTrophy < 0) {
        return 'Invalid requiredTrophy.';
    }

    if (typeof clanDetails.members !== 'number' || clanDetails.members < 0) {
        return 'Invalid members.';
    }

    // Validate domain-specific constraints
    const validClanTypes = ["Open", "Closed", "Invite Only"];
    if (!validClanTypes.includes(clanDetails.clanType)) {
        return `Invalid clanType. Must be one of ${validClanTypes.join(", ")}.`;
    }

    return null;  // If no issues, return null
}


module.exports = {
    validateClan
}