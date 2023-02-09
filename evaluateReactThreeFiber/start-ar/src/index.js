import ReactDOM from 'react-dom'
import { Canvas} from '@react-three/fiber'
import {XRButton, XR} from '@react-three/xr'

function App() {
  return (
    <>
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
        <mesh>
          <boxGeometry />
          <meshBasicMaterial color="blue" />
        </mesh>
      </XR>
    </Canvas>
  </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
