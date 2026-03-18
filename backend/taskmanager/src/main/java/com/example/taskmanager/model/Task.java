cdpackage com.example.taskmanager.model;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Task {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@NotBlank
private String title;
private String description;
private String status;
private LocalDateTime createdAt = LocalDateTime.now();

}
