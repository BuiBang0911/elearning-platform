# Giai đoạn 1: Build ứng dụng
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy các file .csproj vào đúng cấu trúc thư mục để restore dependencies
# Bước này giúp tận dụng Docker Cache, chỉ chạy lại khi bạn thay đổi thư viện (NuGet)
COPY ["Web/Web.csproj", "Web/"]
COPY ["ApplicationCore/ApplicationCore.csproj", "ApplicationCore/"]
COPY ["Infrastructure/Infrastructure.csproj", "Infrastructure/"]

# Thực hiện restore
RUN dotnet restore "Web/Web.csproj"

# Copy toàn bộ mã nguồn còn lại vào container
COPY . .

# Chuyển vào thư mục Web và build
WORKDIR "/src/Web"
RUN dotnet build "Web.csproj" -c Release -o /app/build

# Publish ứng dụng ra thư mục /app/publish
RUN dotnet publish "Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Giai đoạn 2: Runtime (Hình ảnh cuối cùng cực nhẹ)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy các file đã publish từ giai đoạn build
COPY --from=build /app/publish .

# .NET 8 mặc định chạy cổng 8080 cho non-root user
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Chạy file dll chính của dự án Web
ENTRYPOINT ["dotnet", "Web.dll"]