import "./styles.css";
import { Canvas } from "@react-three/fiber";
import { useLoader,addAfterEffect } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { Suspense,useEffect} from "react";
let loaded=false;

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

  function getPositions(n){
    let minx = -2.5, miny = -4, minz= -15;
    let maxx = 2.5, maxy=4, maxz=-3;
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

  return (
    <div className="App">
      <Canvas>
        <ambientLight intensity={0.1} />
          <directionalLight color="red" position={[0, 0, 5]} />
          {
             getPositions(20).map((item,key)=>{
              return (
                <mesh position={[item.x, item.y, item.z]}>
                <boxGeometry args={[0.2, 0.2, 0.2]}/>
                <meshStandardMaterial />
                </mesh>
              )
               
             })     
          }
         
      </Canvas>
    </div>
  );
}
