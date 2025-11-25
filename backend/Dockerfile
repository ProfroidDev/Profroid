# ============================
# 1 - Builder Image
# ============================
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /workspace

COPY . .

RUN chmod +x gradlew
RUN ./gradlew clean bootJar --no-daemon

# ============================
# 2 - Runtime Image
# ============================
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /workspace/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
