import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { calculateFireRiskScore, getRiskColor, getCountyRiskColor, coverRiskFactors } from "./utils";
import { useEffect, useRef, useState, useMemo } from "react";
import { fetchCountyRiskData, fetchMapData } from "./api-service";

interface Controls {
  elevation: number;
  precipitation: number;
  temp: number;
  distanceToLine: number;
  cover: string;
}
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";
const WildfireMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [controls, setControls] = useState<Controls>({
    elevation: 0,
    precipitation: 0,
    temp: 0,
    distanceToLine: 0,
    cover: "Aquatic Vegetation",
  });
  
  const [fireRiskScore, setFireRiskScore] = useState(0);
  const [selectedCounty, setSelectedCounty] = useState("Los Angeles");
  const [countyRiskScore, setCountyRiskScore] = useState<number | null>(null);
  const [isLoadingCountyData, setIsLoadingCountyData] = useState(false);

  const countyOptions = useMemo(
    () => [
      "Los Angeles",
      "San Diego",
      "Orange",
      "San Francisco",
      "Santa Clara"
    ],
    []
  );
  
  const coverOptions = useMemo(
    () => [
      "Aquatic Vegetation",
      "Forest and Woodland",
      "Introduced & Semi Natural Vegetation",
      "Semi-Desert",
      "Recently Disturbed or Modified",
    ],
    []
  );

  const loadCountyData = async (county: string) => {
    setIsLoadingCountyData(true);
    try {
      const riskScore = await fetchCountyRiskData(county);
      setCountyRiskScore(riskScore);
    } catch (error) {
      console.error("Error fetching county risk data:", error);
      setCountyRiskScore(null);
    } finally {
      setIsLoadingCountyData(false);
    }
  };

  useEffect(() => {
    if (selectedCounty) {
      loadCountyData(selectedCounty);
    }
  }, [selectedCounty]);

  useEffect(() => {
    const { elevation, precipitation, temp, distanceToLine, cover } = controls;
    const riskScore = calculateFireRiskScore(
      elevation,
      precipitation,
      temp,
      distanceToLine,
      cover
    );
    setFireRiskScore(riskScore);
  }, [controls]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-119.5, 37.5],
      zoom: 6,
    });

    const initializeMap = async () => {
      try {
        const { wildfireData, boundaryData } = await fetchMapData();

        map.current?.addSource("wildfires", {
          type: "geojson",
          data: wildfireData,
        });

        map.current?.addLayer({
          id: "wildfire-points",
          type: "circle",
          source: "wildfires",
          paint: {
            "circle-radius": 6,
            "circle-opacity": 0.8,
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "fire_risk_score"],
              0,
              "rgb(33,102,172)",
              0.3,
              "rgb(103,169,207)",
              0.5,
              "rgb(209,229,240)",
              0.7,
              "rgb(239,138,98)",
              1,
              "rgb(178,24,43)",
            ],
          },
        });

        map.current?.on("click", "wildfire-points", (e) => {
          const coordinates = e.lngLat;
          const { fire_risk_score } = e.features?.[0]?.properties || {};

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>Fire Risk Score:</strong> ${fire_risk_score}`)
            .addTo(map.current!);
        });

        map.current?.addSource("california-boundary", {
          type: "geojson",
          data: boundaryData,
        });

        map.current?.addLayer({
          id: "california-boundary-layer",
          type: "line",
          source: "california-boundary",
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
            "line-opacity": 0.7,
          },
        });
      } catch (error) {
        console.error("Error loading wildfire data:", error);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const handleControlChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === "cover" ? e.target.value : Number(e.target.value);
    setControls((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCounty(e.target.value);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "20%", padding: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Environmental Controls</h3>
        {Object.entries(controls).map(([key, value]) =>
          key === "cover" ? (
            <label key={key}>
              Cover:
              <select 
                value={value} 
                onChange={handleControlChange(key)}
                style={{ width: "100%", padding: "5px", marginTop: "5px" }}
              >
                {coverOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label key={key}>
              {key.charAt(0).toUpperCase() + key.slice(1)}: 
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={value as number} 
                onChange={handleControlChange(key)} 
                style={{ width: "100%" }}
              /> 
              {value}
            </label>
          )
        )}
        
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          backgroundColor: getRiskColor(fireRiskScore), 
          color: fireRiskScore >= 0.5 ? "white" : "black",
          borderRadius: "5px",
          textAlign: "center",
          fontWeight: "bold"
        }}>
          Predicted Fire Risk: {fireRiskScore}
        </div>
        
        <h3 style={{ margin: "20px 0 10px 0" }}>County Risk Data</h3>
        <label>
          County:
          <select 
            value={selectedCounty} 
            onChange={handleCountyChange}
            style={{ width: "100%", padding: "5px", marginTop: "5px" }}
          >
            {countyOptions.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </label>
        
        {isLoadingCountyData ? (
          <div style={{ textAlign: "center", marginTop: "10px" }}>Loading...</div>
        ) : countyRiskScore !== null ? (
          <div style={{ 
            marginTop: "10px", 
            padding: "15px", 
            backgroundColor: getCountyRiskColor(countyRiskScore), 
            color: countyRiskScore >= 1.0 ? "white" : "black",
            borderRadius: "5px",
            textAlign: "center",
            fontWeight: "bold"
          }}>
            {selectedCounty} Fire Risk: {countyRiskScore.toFixed(1)}
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "10px", color: "#ff0000" }}>
            Error loading county data
          </div>
        )}
      </div>

      <div ref={mapContainer} style={{ width: "80%", height: "100%" }} />
    </div>
  );
};

export default WildfireMap;