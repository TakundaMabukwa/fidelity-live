// 'use client';

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { Skeleton } from '../ui/skeleton'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const DisplayMap = ({ coords, street, city, state, country, zoom = 16 }) => {
  const { lat, lng } = coords || {}
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [loaded, setLoaded] = useState(false)

  const center = lat && lng ? [lng, lat] : null
  console.log('center :>> ', center)
  const formatPopupText = () => {
    return [street, city, state, country].filter(Boolean).join(', ')
  }

  useEffect(() => {
    if (!mapContainer.current || !center) return

    if (map.current) {
      map.current.setCenter(center)
      return
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: center,
      zoom: zoom,
    })

    map.current.on('load', () => {
      setLoaded(true)

      // Smooth zoom to the specified level
      map.current.easeTo({
        center: center,
        zoom: zoom,
        duration: 1000
      })

      new mapboxgl.Marker()
        .setLngLat(center)
        .setPopup(new mapboxgl.Popup().setText(formatPopupText()))
        .addTo(map.current)
    })

    // return () => {
    //   map.current?.remove()
    // }
  }, [center])

  return (
    <div className="rounded-sm w-full h-full overflow-hidden">
      {center ? (
        <div
          ref={mapContainer}
          className="w-full h-full"
          // style={{ width: '100%', minHeight: '400px' }}
        />
      ) : (
        <div className="z-50 flex justify-center items-center bg-white/70 w-full h-full">
          <Skeleton className="w-full h-full" />
        </div>
      )}
    </div>
  )
}

export default DisplayMap

// 'use client'

// import { useRef, useEffect } from 'react'
// import mapboxgl from 'mapbox-gl'
// import 'mapbox-gl/dist/mapbox-gl.css'
// import { Skeleton } from '../ui/skeleton'

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// export default function DisplayMap({ coords, street, city, state, country }) {
//   console.log('params :>> ', { coords, street, city, state, country })
//   const mapContainer = useRef(null)
//   const map = useRef(null)

//   const { lat, lng } = coords || {}
//   const center = lat && lng ? [lng, lat] : null
//   console.log('center :>> ', center)
//   const popupText = [street, city, state, country].filter(Boolean).join(', ')

//   useEffect(() => {
//     if (!mapContainer.current || !center) return

//     if (!mapboxgl.accessToken) {
//       console.error('Mapbox access token is missing.')
//       return
//     }

//     if (map.current) {
//       map.current.setCenter(center)
//       return
//     }

//     map.current = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: 'mapbox://styles/mapbox/streets-v11',
//       center: center,
//       zoom: 12,
//     })

//     new mapboxgl.Marker()
//       .setLngLat(center)
//       .setPopup(new mapboxgl.Popup().setText(popupText))
//       .addTo(map.current)

//     return () => map.current?.remove()
//   }, [center, popupText])

//   return (
//     <div className="rounded-sm w-full h-full overflow-hidden">
//       {center ? (
//         <div
//           ref={mapContainer}
//           style={{ width: '100%', height: '400px' }}
//           className="flex rounded-sm w-full h-full"
//         />
//       ) : (
//         <div className="z-50 flex justify-center items-center bg-white/70 w-full h-full">
//           <Skeleton className="w-full h-full" />
//         </div>
//       )}
//     </div>
//   )
// }