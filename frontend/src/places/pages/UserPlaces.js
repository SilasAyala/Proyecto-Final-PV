import React, {useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';

import PlaceList from '../components/PlaceList';
import { useHttpClient } from '../../shared/hooks/http-hook';
import ErrorModal from '../../shared/components/UIElements/ErrorModal';
import LoadingSpinner from '../../shared/components/UIElements/LoadingSpinner';

const UserPlaces = () => {
  const userId = useParams().userId;
  const [loadedPlaces, setLoadedPlaces] = useState();
  const {isLoading, error, sendRequest, clearError} = useHttpClient();

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const reponseData = await sendRequest(
          `http://localhost:5001/api/places/user/${userId}`
        );
        setLoadedPlaces(reponseData.places);
      } catch(err){
        console.log(err);
      }
    }
    fetchPlaces();
  }, [sendRequest, userId]);

  //funcion para manejo de borrado
  const placeDeletedHandler = (deletedPlaceId) => {
    setLoadedPlaces(prevPlaces => 
      prevPlaces.filter(place => place.id !== deletedPlaceId)  
    )
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      {isLoading &&
        <div className='center'>
          <LoadingSpinner />
        </div>
      }

      {!isLoading && loadedPlaces &&
        <PlaceList items={loadedPlaces} 
          onDeletePlace={placeDeletedHandler} />
      }

    </React.Fragment>
  );
};

export default UserPlaces;
