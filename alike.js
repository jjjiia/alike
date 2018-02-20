$(function() {
  	queue()
      .defer(d3.csv,"R11591277_SL140.csv")
      .await(dataDidLoad);
  })
function dataDidLoad(error,censusData){
    var formatted = formatCensusDictionary(censusData)
    setupMap(formatted)
}

function formatCensusDictionary(censusData){
    var formatted = {}
    for(var i in censusData){
        var row = censusData[i]
        var gid = row["Geo_GEOID"]
        formatted[gid]={}
        for(var r in row){
            formatted[gid][r]=row[r]
        }
    }    
    return formatted
}

function setupMap(censuData){
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjdurroku5gm62sonjjyahriu',
        center: [-98, 38.88],
        minZoom: 2,
        zoom: 8
    });

    map.on('load', function() {

 
          map.setFilter('tracts_census_hover', ['in', 'AFFGEOID',""])
        map.getCanvas().style.cursor = 'pointer';
  
          map.on('click', 'tracts_census', function(e) {
             // map.setFilter("bg-hover", ["==",  "AFFGEOID",""]);
              
             map.setFilter("tracts_census_hover", ["==",  "AFFGEOID", e.features[0].properties[ "AFFGEOID"]]);
            // Change the cursor style as a UI indicator.
            // Single out the first found feature.
            var feature = e.features[0];
            console.log(feature)
        });
        
    });
}

