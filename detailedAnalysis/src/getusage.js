"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_1 = __importDefault(require("../devtools/loader"));
const utils_1 = require("../devtools/utils");
const track_1 = require("../devtools/timelineModel/track");
const timelineUIUtils_1 = __importDefault(require("../devtools/timelineModel/timelineUIUtils"));
const timelineData_1 = __importDefault(require("../devtools/timelineModel/timelineData"));
const counterGraph_1 = __importDefault(require("../devtools/timelineModel/counterGraph"));
const utils_2 = __importDefault(require("./utils"));

class Tracelib {
    constructor(tracelog, range) {
        this.tracelog = tracelog;
        this._timelineLoader = new loader_1.default(this.tracelog);
        this._timelineLoader.init();
        this._performanceModel = this._timelineLoader.performanceModel;
    }

    _findMainTrack() {
        const threads = this._performanceModel
            .timelineModel()
            .tracks();
        const mainTrack = threads.find((track) => Boolean(track.type === track_1.TrackType.MainThread && track.forMainFrame && track.events.length));
        /**
         * If no main thread could be found, pick the thread with most events
         * captured in it and assume this is the main track.
         */
        if (!mainTrack) {
            return threads.slice(1).reduce((curr, com) => curr.events.length > com.events.length ? curr : com, threads[0]);
        }
        return mainTrack;
    }

    _findGPUTrack() {
        const threads = this._performanceModel
        .timelineModel()
        .tracks();
        const GPUTracks = threads.filter((track) => Boolean(track.type === track_1.TrackType.GPU));
        if(!GPUTracks || GPUTracks.length!=1)
            console.log('GPU track found error!')
        return GPUTracks[0];

    }
    getGPUUsage(from,to){
        const timelineUtils = new timelineUIUtils_1.default();
        const startTime = from || this._performanceModel.timelineModel().minimumRecordTime();
        const endTime = to || this._performanceModel.timelineModel().maximumRecordTime();
        const GPUTrack = this._findGPUTrack();
        // We are facing data mutaion issue in devtools, to avoid it cloning syncEvents
        const syncEvents = GPUTrack.syncEvents().slice();
        return Object.assign(Object.assign({}, timelineUtils.statsForTimeRange(syncEvents, startTime, endTime)), { startTime,
            endTime });
    }

    getUsageArray(from,to,name){
        const fs = require('fs');
        let delta=50;
        let cpuusages=[];
        let gpuusages=[];
        let times=[]
        for(let i=from;i<to;i+=delta){
            let summary = this.getSummary(i,i+delta);
            let cpuusage = summary.scripting/(summary.endTime-summary.startTime);
            let gpu_summary = this.getGPUUsage(i,i+delta);
            let gpuusage = gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime);
            cpuusages.push(cpuusage);
            gpuusages.push(gpuusage);
            times.push(i);
        }
        console.log(cpuusages)
        console.log(gpuusages)
        console.log(times)
        try {
            let cpufile = name+'-cpu.txt';
            let gpufile = name+'-gpu.txt';
            let timefile = name+'-time.txt';
            fs.writeFileSync(cpufile, cpuusages.toString());
            fs.writeFileSync(gpufile, gpuusages.toString());
            fs.writeFileSync(timefile, times.toString());
            console.log("File has been saved.");
        } catch (error) {
            console.error(err);
        }
    }

    _findThreadPoolForegroundWorker(){
        const threads = this._performanceModel
        .timelineModel()
        .tracks();
        const PoolTracks = threads.filter((track) => Boolean(track.name === 'ThreadPoolForegroundWorker'));
        return PoolTracks; 
    }

    getImageDecodeTimesThreadPool(){
        const PoolTracks = this._findThreadPoolForegroundWorker();
        // console.log(PoolTracks)
        let startTimes = [];
        let endTimes = [];
        for(let i=0;i<PoolTracks.length;i+=1){
            const PoolTrackEvents = PoolTracks[i]['events'];
            const imageDecodeEvents = PoolTrackEvents.filter((event)=>Boolean(event.name == 'Decode Image'))
            for(let j=0;j<imageDecodeEvents.length;j+=1){
                startTimes.push(imageDecodeEvents[j]['startTime']);
                endTimes.push(imageDecodeEvents[j]['endTime']);
            }
        }
        let totalstart = Math.min.apply(null,startTimes);
        let totalend = Math.max.apply(null,endTimes);
        let duration = totalend - totalstart;
        let value=false;
        if(startTimes.length>=1)
            value=true;
            
        return (
            {
                'value': value,
                'start':totalstart,
                'end':totalend
            }
        )
    }
    getImageDecodeTimesMain(){
        
        let events=this.getMainTrackEvents();
        let imageStartTime = -1;
        let imageEndTime = -1;
        for(let i=0;i<events.length;++i){
            if(events[i].name==='Decode Image'){
                let startTime = events[i].startTime;
                let endTime = events[i].endTime;
                if(imageStartTime===-1 || startTime<imageStartTime)
                    imageStartTime = startTime;
                if(imageEndTime===-1 || endTime>imageEndTime)
                    imageEndTime = endTime;
            }
        }
        let value=false;
        if(imageEndTime!==-1)
            value=true;
        return (
            {
                'value':value,
                'start':imageStartTime,
                'end':imageEndTime
            }
        )
    }

    getImageDecodeTimes(){
        let res1 = this.getImageDecodeTimesMain();
        let res2 = this.getImageDecodeTimesThreadPool()
        if(res1.value && res2.value){
            console.log('Get Image Decode Times Error');
        } else if(res1.value){
            return res1;
        } else if(res2.value){
            return res2;
        } else{
            console.log('Get Image Decode Times Empty');
            return(
                {
                    'start':0,
                    'end':0
                }
            )
        }
    }
  
    getNetworkTimes(){
        let networkRequests = this._performanceModel
        .timelineModel()
        .networkRequests();
        let startTimes = [];
        let endTimes = [];
        for(let i=0;i<networkRequests.length;i+=1){
            startTimes.push(networkRequests[i]['startTime']);
            endTimes.push(networkRequests[i]['endTime']);
        }
        let totalstart = Math.min.apply(null,startTimes);
        let totalend = Math.max.apply(null,endTimes);
        let duration = totalend - totalstart;
        return (
            {
                'start':totalstart,
                'end':totalend
            }
        )
    }
    

    getMainTrackEvents() {
        const mainTrack = this._findMainTrack();
        return mainTrack.events;
    }

    getFPS() {
        const fpsData = {
            times: [],
            values: []
        };
        this._timelineLoader.performanceModel.frames().forEach(({ duration, startTime }) => {
            fpsData.values.push(utils_1.calcFPS(duration));
            fpsData.times.push(startTime);
        });
        return fpsData;
    }

    getSummary(from, to) {
        const timelineUtils = new timelineUIUtils_1.default();
        const startTime = from || this._performanceModel.timelineModel().minimumRecordTime();
        const endTime = to || this._performanceModel.timelineModel().maximumRecordTime();
        const mainTrack = this._findMainTrack();
        // We are facing data mutaion issue in devtools, to avoid it cloning syncEvents
        const syncEvents = mainTrack.syncEvents().slice();
        return Object.assign(Object.assign({}, timelineUtils.statsForTimeRange(syncEvents, startTime, endTime)), { startTime,
            endTime });
    }
    getWarningCounts() {
        const mainTrack = this._findMainTrack();
        return mainTrack.events.reduce((counter, event) => {
            const timelineData = timelineData_1.default.forEvent(event);
            const warning = timelineData.warning;
            if (warning) {
                counter[warning] = counter[warning] ? counter[warning] + 1 : 1;
            }
            return counter;
        }, {});
    }
    getMemoryCounters() {
        const counterGraph = new counterGraph_1.default();
        const counters = counterGraph.setModel(this._performanceModel, this._findMainTrack());
        return Object.keys(counters).reduce((acc, counter) => (Object.assign(Object.assign({}, acc), { [counter]: {
                times: counters[counter].times,
                values: counters[counter].values,
            } })), {});
    }
    getDetailStats(from, to) {
        const timelineUtils = new utils_2.default();
        const startTime = from || this._performanceModel.timelineModel().minimumRecordTime();
        const endTime = to || this._performanceModel.timelineModel().maximumRecordTime();
        const mainTrack = this._findMainTrack();
        // We are facing data mutaion issue in devtools, to avoid it cloning syncEvents
        const syncEvents = mainTrack.syncEvents().slice();
        return Object.assign(Object.assign({}, timelineUtils.detailStatsForTimeRange(syncEvents, startTime, endTime)), { range: {
                times: [startTime, endTime],
                values: [startTime, endTime]
            } });
    }

    getClickTime(){
        let events=this.getMainTrackEvents();
        let  totalend = -1,totalstart=-1;
        for(let i=0;i<events.length;++i){
            if(events[i].args.data){
                if(events[i].args.data.hasOwnProperty('type') && events[i].args.data['type']=='click'){
                    if(totalend===-1 || events[i].endTime > totalend)
                        totalend = events[i].endTime;
                    if(totalstart===-1 || events[i].startTime<totalstart)
                        totalstart = events[i].startTime;
                }
                if(events[i].args.data.hasOwnProperty('interactionType') && events[i].args.data['interactionType']=='tapOrClick'){
                    if(totalend===-1 || events[i].endTime > totalend)
                        totalend = events[i].endTime;
                    if(totalstart===-1 || events[i].startTime<totalstart)
                        totalstart = events[i].startTime;
                }
            }
        }
        return ({
            'start':totalstart,
            'end':totalend
        });
    }

   
  
}

// let models=['Box','BoxTextured','BoomBox','DamagedHelmet'];
// let models=['BoxTextured'];
// let nums=['8','64','512','4096'];
// let writeRes='';
// for(let i=0;i<models.length;++i){
//     for(let j=0;j<nums.length;++j){
//         let filename = './results/vr/aframe/aframe-gltf-'+models[i]+'-'+nums[j]+'.json';
//         let log = require(filename)
//         const tasks = new Tracelib(log);
//         let clickScriptTimes = tasks.getClickTime();
//         let networkTimes = tasks.getNetworkTimes();
//         let imageDecodeTimes = tasks.getImageDecodeTimes();
//         console.log(clickScriptTimes.start,clickScriptTimes.end,networkTimes.start,networkTimes.end,imageDecodeTimes.start,imageDecodeTimes.end)
//         writeRes+=clickScriptTimes.start+','+clickScriptTimes.end+','+networkTimes.start+','+networkTimes.end+','+imageDecodeTimes.start+','+imageDecodeTimes.end+'\n';
//         // console.log(writeRes)
      
//     }
   
// }
// const fs = require('fs');
// fs.writeFileSync('../file2.txt', writeRes);
let starts = [
    292169828.1,
    292364046.4,
    292520491.5,
    292660998.4,
    293018279.8,
    74577265.44,
    74715321.79,
    74852467.42,
    74987460.05,
    75138627.64,
    75282884.58,
    75396279.05,
    75646042.79,
    75789667.04,
    75924080.19,
    76116964.61,
    76285877.76,
    76409378.55,
    76538624.26,
    76827160.21
    ]

let ends = [292169832.3,
    292364064,
    292520529.7,
    292661156.3,
    293019338.5,
    74577272.94,
    74715346.09,
    74852507.32,
    74987689.75,
    75140071.14,
    75282892.48,
    75396306.45,
    75646101.09,
    75789928.84,
    75926246.3,
    76116970.41,
    76285901.66,
    76409423.34,
    76539036.76,
    76831632.31]

let models = ['Box','BoxTextured1','BoxTextured2','BoxTextured4']
let nums = ['8','64','512','4096','32768']
let p=0
for(let i=0;i<models.length;++i){
    for(let j=0;j<nums.length;++j){
        // if(models[i]==='BoxTextured1' || models[i]==='BoxTextured2'){
        //    if(nums[j]!=='8' && nums[j]!=='64'){
        //     continue;
        //    }
        // }
        // if(models[i]==='BoxTextured4'){
        //     if(nums[j]!=='8'){
        //      continue;
        //     }
        //  }
        // if(models[i]!=='Box' && nums[j]==='32768')
        //     continue;
      
        let filename = './results/vr/reactthreefiber/reactthreefiber-gltf-'+models[i]+'-'+nums[j]+'.json'
        let JANK_TRACE_LOG = require(filename);
        const tasks = new Tracelib(JANK_TRACE_LOG);
        let start = starts[p];
        let end = start+5000;
        p+=1;
        let writefile = 'after-reactthreefiber-gltf-'+models[i]+'-'+nums[j];
        tasks.getUsageArray(start,end,writefile)
        // let summary = tasks.getSummary();
        // let cpuusage = summary.scripting/(summary.endTime-summary.startTime);
        // let gpu_summary = tasks.getGPUUsage();
        // console.log(models[i],nums[j],cpuusage,gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime));
    }
}


// let gpu_summary = tasks.getGPUUsage(t5,t6);
// console.log(gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime));
// let clickTime=4005.1;
// let sceneLoadTime=5265;
// let firstRenderTime=5533.5;
// let clickScriptTime = tasks.getClickTime();
// let networkTimes = tasks.getNetworkTimes();
// let imageDecodeTimes = tasks.getImageDecodeTimes();
// let t1=networkTimes.start;
// let t2 = networkTimes.end;
// let t3=imageDecodeTimes.end;
// let t4=sceneLoadTime-clickTime+t1;
// let t5=firstRenderTime-clickTime+t1;
// let t6=t5+60000;

// tasks.getClickTime()
// console.log(clickScriptTime,networkTimes.start,networkTimes.end,imageDecodeTimes.start,imageDecodeTimes.end)


// let example_summary = tasks.getSummary();
// console.log(example_summary)
// console.log(networkTimes)
// console.log(imageDecodeTimes)
// tasks.getUsageArray(11917955.315,t5+1000)


// let summary = tasks.getSummary(t1,t2);
// let cpuusage1 = summary.scripting/(summary.endTime-summary.startTime);
// let gpu_summary = tasks.getGPUUsage(t1,t2);
// let gpuusage1=gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime);
// summary = tasks.getSummary(t2,t3);
// let cpuusage2 = summary.scripting/(summary.endTime-summary.startTime);
// gpu_summary = tasks.getGPUUsage(t2,t3);
// let gpuusage2=gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime);
// summary = tasks.getSummary(t3,t4);
// let cpuusage3 = summary.scripting/(summary.endTime-summary.startTime);
// gpu_summary = tasks.getGPUUsage(t3,t4);
// let gpuusage3=gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime);
// summary = tasks.getSummary(t4,t5);
// let cpuusage4 = summary.scripting/(summary.endTime-summary.startTime);
// gpu_summary = tasks.getGPUUsage(t4,t5);
// let gpuusage4=gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime);
// summary = tasks.getSummary(t5,t6);
// let cpuusage5 = summary.scripting/(summary.endTime-summary.startTime);
// gpu_summary = tasks.getGPUUsage(t5,t6);
// let gpuusage5=gpu_summary.gpu/(gpu_summary.endTime-gpu_summary.startTime);

// console.log(networkTimes.start,networkTimes.end,imageDecodeTimes.start,imageDecodeTimes.end)
// console.log(cpuusage1,gpuusage1,cpuusage2,gpuusage2,cpuusage3,gpuusage3,cpuusage4,gpuusage4,cpuusage5,gpuusage5);

// let loading_summary = tasks.getSummary(t1,t5);
// let loading_cpuusage = loading_summary.scripting/(loading_summary.endTime-loading_summary.startTime);
// let loading_gpu_summary = tasks.getGPUUsage(t1,t5);
// let loading_gpuusage = loading_gpu_summary.gpu/(loading_gpu_summary.endTime-loading_gpu_summary.startTime);
// console.log((100*loading_cpuusage).toFixed(1),(100*loading_gpuusage).toFixed(1),(t5-t1).toFixed(1));


exports.default = Tracelib;
//# sourceMappingURL=index.js.map
