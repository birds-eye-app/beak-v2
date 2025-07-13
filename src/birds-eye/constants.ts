const INITIAL_CENTER = {
  lng: -74.0242,
  lat: 40.6941,
};
const INITIAL_ZOOM = 10.12;

enum RootLayerIDs {
  HistoricalLifers = 'historical_lifers',
  NewLifers = 'new_lifers',
}

const allLayerIdRoots = [RootLayerIDs.HistoricalLifers, RootLayerIDs.NewLifers];

enum SubLayerIDs {
  ClusterCircles = 'cluster_circles',
  ClusterCount = 'cluster_count',
  UnclusteredPointsLabel = 'unclustered_points_label',
  UnclusteredPointsCircle = 'unclustered_point_circle',
  UnclusteredPointsCount = 'unclustered_point_count',
}

const allSubLayerIds = [
  SubLayerIDs.ClusterCircles,
  SubLayerIDs.ClusterCount,
  SubLayerIDs.UnclusteredPointsLabel,
  SubLayerIDs.UnclusteredPointsCircle,
  SubLayerIDs.UnclusteredPointsCount,
];

export {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  RootLayerIDs,
  allLayerIdRoots,
  SubLayerIDs,
  allSubLayerIds,
};
