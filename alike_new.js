//show popups of mouseover already highlighted areas
//set up slider
//persistent url - on load, read each -[origin click gid, column],[origin click gid, column],
//add rollover to tract ids and min and max values

$(function() {
  	queue()
      .defer(d3.csv,"census_percent_2places.csv")
      .defer(d3.csv,"geo_names.csv")
      .defer(d3.json,"census_keys_short.json")
      .defer(d3.json,"deviation.json")
      .defer(d3.json,"minMax.json")
      .defer(d3.json,"histogram.json")
      .await(dataDidLoad);
  })
var colors = ["#c1d098","#7dde49","#6b7b3e","#cbcf49","#69b95a","#d39433","#2679a7","#b38f60","#4a81e7","#6edc50","#56e1a6","#549735","#279564","#2367b7"]
var dataDictionary = {}
var clickCount = 0
var currentCategory = "T002_002"
var notPercentCategories = ["T057_001","T059_001","T083_001","T147_001","T002_001","T002_002","T002_003","T157_001"]
var tractNames =null
var deviation = null
var minMax = null
var histogram = null
function dataDidLoad(error,censusData,geoNames,keys,deviationFile,minMaxFile,histogramFile){
    dataDictionary = keys
    deviation = deviationFile
    tractNames = makeGeoNamesDict(geoNames)
    minMax = minMaxFile
    histogram = histogramFile
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

function setupMap(censusData){
    mapboxgl.accessToken = 'pk.eyJ1IjoiampqaWlhMTIzIiwiYSI6ImNpbDQ0Z2s1OTN1N3R1eWtzNTVrd29lMDIifQ.gSWjNbBSpIFzDXU2X5YCiQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jjjiia123/cjdurroku5gm62sonjjyahriu',
        center: [-98, 38.88],
        minZoom: 3,
        zoom: 6
    });
    map.addControl(new MapboxGeocoder({
        accessToken: mapboxgl.accessToken
    }));
    map.on('load', function() {
        d3.select("#loader").remove()
        d3.select("#zoomOut")
        .on("mouseover",function(){
            d3.select("#zoomOut").style("background-color","rgba(120, 219, 83,1)")
        })
        .on("click",function(){
            map.flyTo({
                center: [-98, 38.88],
                zoom: 4
                });
        })
        .on("mouseout",function(){
            d3.select("#zoomOut").style("background-color","rgba(255,255,255,1)")
        })
        
        d3.select("#clearAll")
        .on("mouseover",function(){
            d3.select("#clearAll").style("background-color","rgba(120, 219, 83,1)")
        })
        .on("click",function(){
            d3.selectAll(".exit").remove()
            for(var i=0; i<100; i+=1){
                d3.select(".text_"+i).remove()
                d3.select(".text2_"+i).remove()
                if (map.getLayer("tracts_filtered_west_"+i)) {
                    map.removeLayer("tracts_filtered_west_"+i)
                }
                if (map.getLayer("tracts_filtered_east_"+i)){
                    map.removeLayer("tracts_filtered_east_"+i)
                }
                if (map.getLayer("tracts_highlight_east_"+i)){
                    map.removeLayer("tracts_highlight_east_"+i)
                }
                if (map.getLayer("tracts_highlight_west_"+i)){
                    map.removeLayer("tracts_highlight_west_"+i)
                }                
            }
          //  map.removeLayer("tracts_filtered_west_"+oldestClickNumber)
        })
        .on("mouseout",function(){
            d3.select("#clearAll").style("background-color","rgba(255,255,255,1)")
        })
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
        //map.addLayer({
        //        "id": "tracts_east",
        //        "type": "fill",
        //        "source": 'tractseast',
        //        "paint": {
        //            "fill-outline-color": "rgba(255,255,255,1)",
        //            "fill-color": "rgba(0,0,0,.1)",
        //        }
        //},"road_major_label")
        //map.addLayer({
        //        "id": "tracts_west",
        //        "type": "fill",
        //        "source": 'tractswest',
        //        "paint": {
        //            "fill-outline-color": "rgba(255,255,255,1)",
        //            "fill-color": "rgba(0,0,0,.1)",
        //        }
        //},"road_major_label")
        
        map.on("click",  "tracts", function(e) {
            clickCount +=1
            var gid = e.features[0].properties[ "AFFGEOID"]
            addTracts(map,censusData,gid,"west")
            addTracts(map,censusData,gid,"east")
            filterGeos(map,censusData,gid) 
        })
      //  map.on("click",  "tracts_east", function(e) {
      //      clickCount +=1
      //      var gid = e.features[0].properties[ "AFFGEOID"]
      //      addTracts(map,censusData,gid,"east")
      //      addTracts(map,censusData,gid,"west")
      //      filterGeos(map,censusData,gid) 
      //      
      //  })
    });
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
    //var threshold = 10//in percent    
    var threshold = 10//deviation[category]
   // console.log(category)
    var matchedId = census.filter(function(el){
       // console.log(el)
        if(el["Gid"]==gid){
            return el
        }
    })
    var value= parseFloat(matchedId[0][category])
    var gidName = tractNames[matchedId[0].Gid]
    var filteredData = filterByData(census,threshold,category,value)
    var filteredStats = calculateFiltered(filteredData,category)
    var text = "<strong>"+gidName+ " has "+value+" "+dataDictionary[currentCategory]
    +"</strong><br/>"
    var text2 = translateStats(filteredStats,threshold)
    
    
    //below is for exiting out of specific textbox
    d3.select("#text")
        .append("div")
        .attr("class","exit exit_"+clickCount)
        .html("&#10005")
        .style("cursor","pointer")
        .style("color",colors[clickCount%(colors.length-1)])
        .style("width","100%")
        .style("text-align","right")
        .style("margin-right","20px")
        .on("click",function(){
            var count = d3.select(this).attr("class").split("_")[1]
            d3.select(".exit_"+count).remove()
            d3.select(".text_"+count).remove()
            d3.select(".text2_"+count).remove()
            map.removeLayer("tracts_filtered_east_"+count)
            map.removeLayer("tracts_filtered_west_"+count)
            map.removeLayer("tracts_highlight_east_"+count)
            map.removeLayer("tracts_highlight_west_"+count)
        })
    d3.select("#text").append("div")
        .attr("class","clickText text_"+clickCount)
        .html(text)
        .style("color",colors[clickCount%(colors.length-1)])
        
    d3.select("#text").append("div")
        .attr("class","clickText text2_"+clickCount)
        .html(text2)
        .style("color",colors[clickCount%(colors.length-1)])
        
    slider(gid,value,category,map,census)
    //histo(gid,value,category)  
    filterMap(filteredData,map,clickCount)
}
function slider(gid,value,category,map,census){
    var margin = {right: 20, left: 10}
    var width = $("#text").innerWidth()
    var svg = d3.select(".text_"+clickCount).append("svg").attr("width",width-margin.left).attr("height",30)
    var width = +svg.attr("width") - margin.left - margin.right
    var height = +svg.attr("height");
    var max = minMax[category].max
    var max = minMax[category].min
    var sliderRange = max/value
    var x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width])
        .clamp(true);

    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + 0 + "," + height / 2 + ")");
    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 5);
    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function() { 
            return this.parentNode.appendChild(this.cloneNode(true)); 
        })
        .attr("class", "track-inset")
        .select(function() { 
            return this.parentNode.appendChild(this.cloneNode(true)); 
        })
        .attr("class", "track-overlay")
        .attr("clickCount",clickCount)
        .call(d3.drag()
//            .on("start.interrupt", function() { 
//                slider.interrupt(); 
//            })
            .on("start drag", function() { 
                var sliderPosition = x.invert(d3.event.x)
                handle.attr("cx", x(sliderPosition))
                var currentClick = d3.select(this).attr("clickCount")                
          // })
          // .on("end",function(){
               var sliderPosition = x.invert(d3.event.x)
              var threshold = sliderPosition
                var filteredData = filterByData(census,threshold,category,value)
                filterMap(filteredData,map,currentClick)
                var filteredStats = calculateFiltered(filteredData,category)
                var text2 = translateStats(filteredStats,threshold)
              d3.select(".text2_"+currentClick).html(text2)
            })
        );
    handle.attr("cx", x(10))
    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .append("text")
        .attr("text-anchor", "start")
        .text("less")
        .attr("y", 2)
        .attr("x",10)
        .append("text")
        .attr("text-anchor", "end")
        .text("more")
        .attr("y", 2)
        .attr("x",width-margin.left);
    
}

function histo(gid,value,category){
    var array = new Array(100);
    var xmin = minMax[category].min
    var xmax = minMax[category].max
    var ymax = d3.max(d3.values(histogram[category])); 
    var width = $("#text").innerWidth()
    var height = 100
    var margin = 20
    var segment = histogram[category].segment
    var sd = deviation[category]
    var x = d3.scaleLinear().domain([0,100]).range([0,width-margin*3])
    var c = d3.scaleLinear().domain([xmin,xmax]).range([0,1])
    var y = d3.scaleLinear().domain([0,ymax]).range([height-margin*2,0])
   
    var line = d3.line()
    .x(function(d,i){
        return x(i)
    })
    .y(function(d,i){
        return y(histogram[category][i])
    })
    
    //var svg = d3.select(".text_"+clickCount)
    var svg = d3.select(".text_"+clickCount)
        .append("svg")
        .attr("width",width)
        .attr("height",height)
       // .attr("class","slider_"+clickCount)
    var g = svg.append("g").attr("transform", "translate(" + margin*2 + "," + margin + ")");
    g.append("g")
          .attr("transform", "translate(0," + (height-margin*2) + ")")
          .call(d3.axisBottom(x)
                .ticks(3)
                .tickFormat(function(d){return Math.round(d*segment)}))
        .select(".domain")

    g.append("g")
        .call(d3.axisLeft(y).ticks(3))
         .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 2)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("tracts");
        
    g.append("path")
       .datum(array)
        .attr("class","histogram")
        .attr("fill","none")
        .attr("stroke","black")
        .attr("d",line)
    
    g.append("rect")
        .attr("height",height-margin)
        .attr("width",function(){
            return x(2)
        })
        .attr("x",function(d,i){
            return 5
            return x((value-1)*segment)
        })
        .attr("y",0)
        .attr("fill",colors[clickCount%(colors.length-1)])
        .attr("opacity",.5)
}

function filterMap(filteredData,map,currentClick){
    var gids = []
    for(var i in filteredData){
        var gid = filteredData[i]["Gid"].replace("14000US","1400000US")
        gids.push(gid)
    }
    var filter = ["in","AFFGEOID"].concat(gids)
    map.setFilter("tracts_filtered_west"+"_"+currentClick, filter);
    map.setFilter("tracts_filtered_east"+"_"+currentClick, filter);
}

function translateStats(filteredStats,threshold){
    text = filteredStats["tracts"]+" other tracts are within ±"+Math.round(threshold*100)/100+"%<br/>"
    text = text+"or between "+filteredStats["min"]+" and "+filteredStats["max"]+"<br/>"
    text = text+"containing: "+filteredStats["T002_001"]+" people and "+filteredStats["T002_003"]+" sq.mi."
    return text
    var tracts = ""
    var text = ""
    for(var i in filteredStats){
        if(i != "tracts"){
            text+= filteredStats[i]+" "+dataDictionary[i]+"<br/>"
        }else{
            tracts +=filteredStats[i]+" other tracts are similar*,<br/>"
        }
    }
    return tracts+text 
}
function calculateFiltered(filteredData,category){
    var max = d3.max(filteredData,function(d){
        return d[category]
    }); 
    var min = d3.min(filteredData,function(d){
        return d[category]
    }); 
    var columnsToSum = ["T002_001","T002_003"]
    var totals = [318558162,3532068.72]//total pop,total area
    var formatted = {}
    for(var i in columnsToSum){
        var c = columnsToSum[i]
        var sum = d3.sum(filteredData, function(d){
            return d["SE_"+c];});  
            var percent = (Math.round(sum/totals[i]*10000)/100).toLocaleString()
        formatted[c]=Math.round(sum).toLocaleString()+"("+percent+"%)"
       // formatted[c+"_p"]=(Math.round(sum/totals[i]*10000)/100).toLocaleString()
    }
    formatted["tracts"]=filteredData.length
    formatted["max"]=max
    formatted["min"]=min
    return formatted
}

function filterByData(census,threshold,category,value){
   // console.log(threshold)
    var withinThreshold = census.filter(function(el){
       // if(notPercentCategories.indexOf(category)==-1){//if it if in percents
       //     if(Math.round(el[category])==Math.round(value)){
       //         return el["Gid"]
       //     }
       // }else{
            if(el[category]<value*(1+threshold/100) && el[category]>value*(1-threshold/100)){
            //if(el[category]<value*(1+threshold/100) && el[category]>value*(1-threshold/100)){
                return el["Gid"]
            }
      //  }
    })
 //   console.log(withinThreshold)
    return withinThreshold
}