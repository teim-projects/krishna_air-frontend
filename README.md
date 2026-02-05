<!-- For running project using docker in development eviroment -->
## Install docker desktop on system 

## start docker 

## run -: 
docker compose -f docker/docker-compose.dev.yml up -d

## stop/delete container -:

<!-- If u delete volume also then use -v at the end of command  -->
docker compose -f docker/docker-compose.dev.yml down 


## access the container 
<!-- use bash or shell  -->
docker exec -it container_name bash