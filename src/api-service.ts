const API_BASE_URL = 'https://20o83xp9bd.execute-api.us-west-1.amazonaws.com/teststage';
const S3_BASE_URL = 'https://atswildfireappef2b1923c3ba487db36dac6c21da6c4a3555a-dev.s3.us-west-1.amazonaws.com';

export const fetchCountyRiskData = async (county: string): Promise<number | null> => {
    const formattedCounty = county.replace(/ /g, "_");
    const response = await fetch(`${API_BASE_URL}?name=${formattedCounty}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const responseData = await response.json();

    let bodyData;
    if (typeof responseData.body === 'string') {
        bodyData = JSON.parse(responseData.body);
    } else {
        bodyData = responseData.body;
    }

    return bodyData.fire_risk || null;
};

export const fetchMapData = async () => {
    const [wildfireRes, boundaryRes] = await Promise.all([
        fetch(`${S3_BASE_URL}/wildfire.geojson`),
        fetch(`${S3_BASE_URL}/california-counties.geojson`),
    ]);

    const [wildfireData, boundaryData] = await Promise.all([
        wildfireRes.json(),
        boundaryRes.json(),
    ]);

    wildfireData.features.forEach((feature: any) => {
        feature.properties.fire_risk_score = parseFloat(feature.properties.fire_risk_score) || 0;
    });

    return { wildfireData, boundaryData };
};