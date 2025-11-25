FROM gradle:8.8-jdk17 AS builder
WORKDIR /app

COPY . /app/

RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
