export const playerReducer = (state = {}, action) => {
  switch (action.type) {
    case 'FETCH_STATUS_SUCCESS':
      return {
        ...state,
        status: action.status
      };
    case 'SEGMENTS':
      return {
        ...state,
        segments: action.segments
      };
    default:
      return state;
  }
};

export default playerReducer;
