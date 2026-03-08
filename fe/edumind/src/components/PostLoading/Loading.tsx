import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const Loading = () => {
  return (
    <div>
      <h1><Skeleton width={200} /></h1>
      <p><Skeleton count={3} /></p>
    </div>
  )
}

export default Loading