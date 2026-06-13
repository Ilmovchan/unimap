FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

USER app

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG configuration=Release
WORKDIR /src

COPY ["server/api/api.csproj", "server/api/"]
COPY ["server/app/app.csproj", "server/app/"]
COPY ["server/domain/domain.csproj", "server/domain/"]
COPY ["server/infrastructure/infrastructure.csproj", "server/infrastructure/"]
COPY ["server/persistence/persistence.csproj", "server/persistence/"]
RUN dotnet restore "server/api/api.csproj"

COPY . .
WORKDIR "/src/server/api"
RUN dotnet build "api.csproj" -c $configuration --no-restore -o /app/build

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "api.csproj" -c $configuration --no-restore -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "api.dll"]