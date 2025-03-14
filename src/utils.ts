export const coverRiskFactors = {
    "Aquatic Vegetation": 0.1,
    "Forest and Woodland": 0.8,
    "Introduced & Semi Natural Vegetation": 0.5,
    "Semi-Desert": 0.6,
    "Recently Disturbed or Modified": 0.7,
};

export const calculateFireRiskScore = (
    elevation: number,
    precipitation: number,
    temp: number,
    distanceToLine: number,
    cover: string
): number => {
    const elevationFactor = elevation / 100;
    const precipitationFactor = 1 - (precipitation / 100);
    const tempFactor = temp / 100;
    const distanceFactor = 1 - (distanceToLine / 100);
    const coverFactor = coverRiskFactors[cover as keyof typeof coverRiskFactors];

    const riskScore = (
        elevationFactor * 0.15 +
        precipitationFactor * 0.25 +
        tempFactor * 0.3 +
        distanceFactor * 0.1 +
        coverFactor * 0.2
    );

    return Math.round(riskScore * 100) / 100;
};

export const getRiskColor = (score: number): string => {
    if (score < 0.3) return "#3182bd";
    if (score < 0.5) return "#6baed6";
    if (score < 0.7) return "#fd8d3c";
    return "#bd0026";
};

export const getCountyRiskColor = (score: number): string => {
    if (score < 0.7) return "#3182bd";
    if (score < 1.0) return "#6baed6";
    if (score < 1.3) return "#fd8d3c";
    return "#bd0026";
};