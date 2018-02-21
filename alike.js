$(function() {
  	queue()
      .defer(d3.csv,"R11591277_SL140.csv")
      .defer(d3.json,"census_keys.json")
      .await(dataDidLoad);
  })
var colors = ["#c1d098","#7dde49","#6b7b3e","#cbcf49","#69b95a"]
var dataDictionary = {}
function dataDidLoad(error,censusData,keys){
    dataDictionary = keys
    var formatted = formatCensusDictionary(censusData)
    console.log(censusData[0])
    
    setupMap(censusData)
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

function setupMap(censusData){
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjdurroku5gm62sonjjyahriu',
        center: [-98, 38.88],
        minZoom: 2,
        zoom: 6
    });
    map.on('load', function() {
            addTracts(map,censusData)
         });
}

function addTracts(map,censusData){
    map.addSource('tractseast',{
        "type":"geojson",
        "data":'https://raw.githubusercontent.com/jjjiia/alike/master/east.geojson'
    })
    map.addSource('tractswest',{
        "type":"geojson",
        "data":'https://raw.githubusercontent.com/jjjiia/alike/master/west.geojson'
    })
    map.addLayer({
            "id": "tracts_east",
            "type": "fill",
            "source": 'tractseast',
            "paint": {
                "fill-outline-color": "rgba(0,0,0,.1)",
                "fill-color": "rgba(0,0,0,.05)",
            }
        })
        map.addLayer({
                "id": "tracts_west",
                "type": "fill",
                "source": 'tractswest',
                "paint": {
                    "fill-outline-color": "rgba(0,0,0,.1)",
                "fill-color": "rgba(0,0,0,.05)",
                }
            })
            
            
     map.addLayer({
             "id": "tracts_highlight_east",
             "type": "fill",
            "source": 'tractseast',
             "paint": {
                 "fill-outline-color": "rgba(0,0,0,.5)",
                     "fill-color": "rgba(255,255,255,1)",
             },
             "filter": ["in", "FIPS", ""]
         })
         map.addLayer({
                 "id": "tracts_highlight_west",
                 "type": "fill",
                "source": 'tractswest',
                 "paint": {
                     "fill-outline-color": "rgba(0,0,0,.5)",
                     "fill-color": "rgba(255,255,255,1)",
                 },
                 "filter": ["in", "FIPS", ""]
             })
         
             map.addLayer({
                     "id": "tracts_filtered_east",
                     "type": "fill",
                    "source": 'tractseast',
                     "paint": {
                         "fill-outline-color": "red",//"rgba(0,0,0,.5)",
                             "fill-color": "rgba(255,255,255,1)",
                     },
                     "filter": ["in", "FIPS", ""]
                 })
                 map.addLayer({
                         "id": "tracts_filtered_west",
                         "type": "fill",
                        "source": 'tractswest',
                         "paint": {
                             "fill-outline-color": "red",//"rgba(0,0,0,.5)",
                             "fill-color": "rgba(255,255,255,1)",
                         },
                         "filter": ["in", "FIPS", ""]
                     })
         
         
         
         
         map.on("click", "tracts_east", function(e) {
             map.setFilter("tracts_highlight_east", ["==",  "AFFGEOID", e.features[0].properties[ "AFFGEOID"]]);
             map.setFilter("tracts_highlight_west", ["==",  "AFFGEOID", e.features[0].properties[ "AFFGEOID"]]);
             var gid = e.features[0].properties["AFFGEOID"].replace("1400000US","14000US")
             getMatches(gid,censusData,map)
         });
         map.on("click", "tracts_west", function(e) {
             map.setFilter("tracts_highlight_west", ["==",  "AFFGEOID", e.features[0].properties[ "AFFGEOID"]]);
             map.setFilter("tracts_highlight_east", ["==",  "AFFGEOID", e.features[0].properties[ "AFFGEOID"]]);
             var gid = e.features[0].properties["AFFGEOID"].replace("1400000US","14000US")
             getMatches(gid,censusData,map)
         }); 
}
function getMatches(gid,census,map){
    var densityCat = "SE_T002_002"
    var threshold = 10//in percent    
    var matchedId = census.filter(function(el){
       // console.log(el)
        if(el["Geo_GEOID"]==gid){
            return el
        }
    })
    var cDensity= matchedId[0][densityCat]
    var filteredData = filterByData(census,threshold,densityCat,cDensity)
    var filteredStats = calculateFiltered(filteredData)
    var text = translateStats(filteredStats)
    d3.select("#text").html(text)
    
    filterMap(filteredData,map)
}

function filterMap(filteredData,map){
    var gids = []
    for(var i in filteredData){
        var gid = filteredData[i]["Geo_GEOID"].replace("14000US","1400000US")
        gids.push(gid)
    }
    var filter = ["in","AFFGEOID"].concat(gids)
    map.setFilter("tracts_filtered_west", filter);
    map.setFilter("tracts_filtered_east", filter);
}

function translateStats(filteredStats){
    var tracts = ""
    var text = ""
    for(var i in filteredStats){
        if(i != "tracts"){
            text+= filteredStats[i]+" "+dataDictionary[i]+"<br/>"
        }else{
            tracts +=filteredStats[i]+" other tracts have the similar population density (less than 10% difference), containing: <br/>"
        }
        
    }
    return tracts+text
}
function calculateFiltered(filteredData){
    var columnsToSum = ["T004_001","T002_003","T145_002","T139_001","T056_001","T013_002","T013_003","T013_004","T013_005"]
    var formatted = {}
    for(var i in columnsToSum){
        var c = columnsToSum[i]
        var sum = d3.sum(filteredData, function(d) { 
            return d["SE_"+c]; });  
        formatted[c]=sum   
    }
    formatted["tracts"]=filteredData.length
    return formatted
}

function filterByData(census,threshold,category,value){
    var withinThreshold = census.filter(function(el){
        if(el[category]<value*(1+threshold/100) && el[category]>value*(1-threshold/100)){
            return el["Geo_GEOID"]
        }
    })
    return withinThreshold
}