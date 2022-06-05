import {useState,
        useCallback, 
        useRef,
        useEffect} from 'react';

export const useHttpClient = () =>{
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    const activeHttpRequest = useRef([]); //almacenamos constante para sobrevivir renderizaciones

    //metodo para generar solicitud al backend.
    const sendRequest = 
        useCallback(async (url, method = 'GET', body=null, headers={}) => {
            setIsLoading(true);

            const httpAborCtrl = new AbortController();
            activeHttpRequest.current.push(httpAborCtrl);

            try{
                const reponse = 
                    await fetch(url, 
                        {method, body, headers, signal: httpAborCtrl.signal});
                const responseData = await reponse.json();
                
                //detenemos la solicitud en función del signal.
                activeHttpRequest.current = activeHttpRequest.current.filter(
                    reqCtrl => reqCtrl !== httpAborCtrl
                );

                if(!reponse.ok){
                    throw new Error(responseData.message);
                }
                setIsLoading(false);
                return responseData;
            } catch(err){
                setIsLoading(false);
                setError(err.message);
                throw err;
            }
            
        }, []);

    //metodo para desmontar el componente luego de completar la renderización del error.
    const clearError = () => {
        setError(null);
    }

    //procesamos solicitud de abortar de parte del usuario.
    useEffect(() => {
        return () => {
            activeHttpRequest.current.forEach(abortReq => abortReq.abort());
        }
    }, []);

    return {isLoading, error, sendRequest, clearError}
}