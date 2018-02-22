//show popups of mouseover already highlighted areas

//show total for all clicks
//get standard diviations and use as threshold


$(function() {
  	queue()
      .defer(d3.csv,"census_percent_2places.csv")
    .defer(d3.csv,"geo_names.csv")
      .defer(d3.json,"census_keys_short.json")
      .await(dataDidLoad);
  })
var colors = ["#c1d098","#7dde49","#6b7b3e","#cbcf49","#69b95a","#d39433","#2679a7","#b38f60","#cde144","#4a81e7","#6edc50","#56e1a6","#549735","#279564","#2367b7"]
var dataDictionary = {}
var clickCount = 0
var currentCategory = "T002_002"
var notPercentCategories = ["T057_001","T059_001","T083_001","T147_001","T002_001","T002_002","T002_003","T157_001"]
var tractNames =null
function dataDidLoad(error,censusData,geoNames,keys){
    dataDictionary = keys
    
    tractNames = makeGeoNamesDict(geoNames)
    //var percentFormatted = formatCensusAsPercents(censusData)
    var notDropdown = ["T002_001","T002_003","T004_001","T005_001","T007_001","T013_001","T025_001","T030_001","T050_001","T053_001","T056_001","T078_001","T080_001","T081_001","T094_001","T108_001","T182_001","T139_001","T145_001"]
    
    var select = d3.select("#title").append("select").attr("class","dropdown").attr("id","dropdown").attr("name","dropdown")
    for(var k in keys){
        if(notDropdown.indexOf(k)==-1){
            select.append("option").attr("class","option").attr("value",k).html(keys[k])
        }
    }
    document.getElementById("dropdown").onchange=function(){
//        console.log(this.value)
        currentCategory=this.value
    }
    setupMap(censusData)
}
function makeGeoNamesDict(geoNames){
    var formatted = {}
    for(var g in geoNames){
        var geoName = geoNames[g]["Geo_NAME"]
        var geoId = geoNames[g]["Geo_GEOID"]
        formatted[geoId]=geoName
    }
    return formatted
}

//function formatCensusAsPercents(censusData){
//    console.log(["start processing",censusData[0]])
//    var formatted = []
//    var categoriesToInclude = Object.keys(dataDictionary)
//    
//    for(var i in censusData){
//        var row = censusData[i]
//        var gid = row["Gid"]
//        //formatted[gid]={}
//        var entry = {}
//        for(var r in row){
//            
//            if(categoriesToInclude.indexOf(r.replace("SE_",""))>-1||r.split("_")[0]=="Geo"){            
//                if(r.split("_")[2]!="001" && r.split("_")[0]!="Geo"&&notPercentCategories.indexOf(r.replace("SE_",""))==-1){
//                    var totalKey = r.split("_")[0]+"_"+r.split("_")[1]+"_001"
//                    var totalValue = parseInt(row[totalKey])
//                    var value = parseInt(row[r])
//                    var percent = value/totalValue*100
//                    entry[r]= percent
//                
//            }else if(notPercentCategories.indexOf(r.replace("SE_",""))>-1||r.split("_")[0]=="Geo"){
//                entry[r]= row[r]
//            }
//        }
//        }
//        formatted.push(entry)
//       // break
//    }
//   // console.log(formatted)
//    console.log(["end processing",formatted[0]])
//    
//    return formatted
//}

function setupMap(censusData){
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjdurroku5gm62sonjjyahriu',
        center: [-98, 38.88],
        minZoom: 3,
        zoom: 6
    });
    map.on('load', function() {
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }));
        d3.select(".mapboxgl-ctrl-bottom-right").remove()
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
                    "fill-outline-color": "rgba(255,255,255,1)",
                    "fill-color": "rgba(0,0,0,.05)",
                }
        },"road_major_label")
        map.addLayer({
                "id": "tracts_west",
                "type": "fill",
                "source": 'tractswest',
                "paint": {
                    "fill-outline-color": "rgba(255,255,255,1)",
                    "fill-color": "rgba(0,0,0,.05)",
                }
        },"road_major_label")
        
     
        
        map.on("click",  "tracts_west", function(e) {
            clickCount +=1
            eraseOldestClick(map,clickCount-3)
            var gid = e.features[0].properties[ "AFFGEOID"]
            addTracts(map,censusData,gid,"west")
            addTracts(map,censusData,gid,"east")
            filterGeos(map,censusData,gid) 
        })
        map.on("click",  "tracts_east", function(e) {
            clickCount +=1
            eraseOldestClick(map,clickCount-3)
            var gid = e.features[0].properties[ "AFFGEOID"]
            addTracts(map,censusData,gid,"east")
            addTracts(map,censusData,gid,"west")
            filterGeos(map,censusData,gid) 
            
        })
    });
}
function eraseOldestClick(map,oldestClickNumber){
    if(oldestClickNumber>1){
        d3.select(".text_"+oldestClickNumber).remove()
        map.removeLayer("tracts_highlight_east_"+oldestClickNumber)
        map.removeLayer("tracts_highlight_west_"+oldestClickNumber)
        map.removeLayer("tracts_filtered_east_"+oldestClickNumber)
        map.removeLayer("tracts_filtered_west_"+oldestClickNumber)
        
    }
}
function addTracts(map,censusData,gid,ew){
    
            map.addLayer({
                    "id": "tracts_highlight_"+ew+"_"+clickCount,
                    "type": "fill",
                   "source": 'tracts'+ew,
                    "paint": {
                        "fill-outline-color": colors[clickCount%(colors.length-1)],
                            "fill-color": colors[clickCount%(colors.length-1)],
                    },
                    "filter": ["in", "FIPS", ""]
                })

         
             map.addLayer({
                     "id": "tracts_filtered_"+ew+"_"+clickCount,
                     "type": "fill",
                    "source": 'tracts'+ew,
                     "paint": {
                         "fill-outline-color": colors[clickCount%(colors.length-1)],//"rgba(0,0,0,.5)",
                             "fill-color": colors[clickCount%(colors.length-1)],
                         "fill-opacity":.4
                     },
                     "filter": ["in", "FIPS", ""]
                 },"road_major_label")
            
         
         
} 
function filterGeos(map,censusData,gid) {       
         
      //   map.on("click", "tracts_east", function(e) {
             map.setFilter("tracts_highlight_east_"+clickCount, ["==",  "AFFGEOID", gid]);
             map.setFilter("tracts_highlight_west_"+clickCount, ["==",  "AFFGEOID", gid]);
             var gidShort = gid.replace("1400000US","14000US")
             getMatches(gidShort,censusData,map)
        // });
    }
    


function getMatches(gid,census,map){
    var category = "SE_"+currentCategory
    var threshold = 10//in percent    
    var matchedId = census.filter(function(el){
       // console.log(el)
        if(el["Gid"]==gid){
            return el
        }
    })
    var value= parseFloat(matchedId[0][category])
    console.log(value)
    var gidName = tractNames[matchedId[0].Gid]
    var filteredData = filterByData(census,threshold,category,value)
    var filteredStats = calculateFiltered(filteredData)
    
    console.log(filteredData)
    var text = "<strong>"+gidName+ " has "+value+" "+dataDictionary[currentCategory]+"</strong><br/>"+translateStats(filteredStats)
    d3.select("#text").append("div").attr("class","clickText text_"+clickCount).html(text).style("color",colors[clickCount%(colors.length-1)])
    
    filterMap(filteredData,map)
}

function filterMap(filteredData,map){
    var gids = []
    for(var i in filteredData){
        var gid = filteredData[i]["Gid"].replace("14000US","1400000US")
        gids.push(gid)
    }
    var filter = ["in","AFFGEOID"].concat(gids)
    map.setFilter("tracts_filtered_west"+"_"+clickCount, filter);
    map.setFilter("tracts_filtered_east"+"_"+clickCount, filter);
}

function translateStats(filteredStats){
    var tracts = ""
    var text = ""
    for(var i in filteredStats){
        if(i != "tracts"){
            text+= filteredStats[i]+" "+dataDictionary[i]+"<br/>"
        }else{
            tracts +=filteredStats[i]+" other tracts are similar*, containing: <br/>"
        }
        
    }
    return tracts+text 
}
function calculateFiltered(filteredData){
    
    var columnsToSum = ["T002_001","T002_003"]
    var formatted = {}
    for(var i in columnsToSum){
        var c = columnsToSum[i]
        var sum = d3.sum(filteredData, function(d){
            return d["SE_"+c];});  
        formatted[c]=Math.round(sum).toLocaleString()
    }
    formatted["tracts"]=filteredData.length
    return formatted
}

function filterByData(census,threshold,category,value){
    
    var withinThreshold = census.filter(function(el){
        if(notPercentCategories.indexOf(category)==-1){
            if(Math.round(el[category])==Math.round(value)){
                return el["Gid"]
            }
        }else{
            if(el[category]<value*(1+threshold/100) && el[category]>value*(1-threshold/100)){
                return el["Gid"]
            }
        }
    })
    return withinThreshold
}