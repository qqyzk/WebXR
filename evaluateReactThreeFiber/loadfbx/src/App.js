import "./styles.css";
import { Canvas } from "@react-three/fiber";
import { useLoader,addAfterEffect } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { Suspense,useEffect} from "react";
let loaded=false;
const Model = () => {
    const fbx=useLoader(FBXLoader, "./fbx/DamagedHelmet/DamagedHelmet.fbx", (loader) => {
        loaded=true;
    })
   
  return (
    <>
      <primitive object={fbx} scale={1} />
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
      <Canvas>
      <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <directionalLight color="white" position={[0, 0, 5]} />
          <Model />
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
