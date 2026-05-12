FROM maven:3.8.6-openjdk-8 AS builder

WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:8-jdk-slim

WORKDIR /app

COPY --from=builder /build/target/dgkj-server.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
