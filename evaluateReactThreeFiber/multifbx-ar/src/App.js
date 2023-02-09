import "./styles.css";
import { Canvas } from "@react-three/fiber";
import { useLoader,addAfterEffect } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Suspense,useEffect} from "react";
import {XRButton, XR} from '@react-three/xr'
let name = 'DamagedHelmet';
let N=2;
function getPositions(n){
  let minx = -1.2, miny = -2, minz= -15;
  let maxx = 1.2, maxy=2, maxz=-5;
 
  let edgeNum=n;
  let positions = [];
  for(let i=0;i<edgeNum;++i){
      for(let j=0;j<edgeNum;++j){
          for(let k=0;k<edgeNum;++k){   
              let curx = minx + (maxx-minx)/(edgeNum-1)*i;
              let cury = miny+ (maxy-miny)/(edgeNum-1)*j;
              let curz = minz + (maxz-minz)/(edgeNum-1)*k;
              positions.push({'x':curx,'y':cury,'z':curz});
          }
      }
  }
  return positions;
}

let loaded=false;
const Model = () => {
    let url,scale;
    if(name==='Box'){
      url="./fbx/Box/Box.fbx";
      scale = 0.2;
    }else if(name==='BoxTextured'){
      url="./fbx/BoxTextured/BoxTextured.fbx";
      scale = 0.2;
    }else if(name==='BoomBox' ){
      url="./fbx/BoomBox/BoomBox.fbx";
      scale = 0.2;
    }else if(name==='DamagedHelmet'){
      url="./fbx/DamagedHelmet/DamagedHelmet.fbx";
      scale = 0.002;
    }
    const fbx=useLoader(FBXLoader,url , (loader) => {
      loaded=true;
    })
  
    let objs=[]
    getPositions(N).map((item,key)=>{
      let res = <primitive object={fbx.clone()} scale={scale}  position={[item.x,item.y,item.z]}/>;
      objs.push(res);
    })
    return (
      <>
      {
        objs
      }
      </>
    );
  
};




let startFlag = true;
let frameCount = 0;
let startTime = null;
let shouldLog = true;
export default function App() {


  //react hook, 函数组件每一次更新都会触发effect
  //组件更新挂在完成->执行useLayoutEffect->浏览器dom绘制完成->执行useEffect回调
  useEffect(()=>{
    addAfterEffect(()=>{
      if (loaded){
          let time=performance.now();
          if (startFlag) {
              startTime = time;
              startFlag = false;
              console.log('startTime',startTime);
          }
          frameCount += 1;
          if(frameCount % 1000 === 0) {
              let fps = 1000 * frameCount / (time - startTime);
              console.log(frameCount,fps,'fps');
          } 
          if ((time - startTime) /1000 > 60 && shouldLog){
              shouldLog = false;
              let fps = 1000 * frameCount / (time - startTime);
              console.log('1min', (time - startTime)/1000, frameCount,fps,'fps');
          }
      }
    })
  })
 
  return (
    <div className="App">
        <XRButton
        /* The type of `XRSession` to create */
        mode={'AR'}
        sessionInit={{ optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'] }}
        /** Whether this button should only enter an `XRSession`. Default is `false` */
        enterOnly={false}
        /** Whether this button should only exit an `XRSession`. Default is `false` */
        exitOnly={false}
      >
        {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
        {(status) => `WebXR ${status}`}
      </XRButton>
      <Canvas>
      <XR>
      <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <directionalLight color="white" position={[0, 0, 5]} />
          <Model />
          <OrbitControls />
        </Suspense>
      </XR>
      </Canvas>
    </div>
  );
}
