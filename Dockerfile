# Build stage
FROM maven:3.8.4-openjdk-17 AS build
WORKDIR /app
# Copy the backend source code
COPY backEnd/pom.xml ./
COPY backEnd/src ./src
# Build the application
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
